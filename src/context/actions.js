import { supabase } from '../utils/supabase';
import { deriveActualsFromEntry } from '../utils/scenarioCalculations';

const getDefaultExpenseTargets = () => ({
  'exp-main-1': 20, 'exp-main-2': 35, 'exp-main-3': 10, 'exp-main-4': 0,
  'exp-main-5': 10, 'exp-main-6': 5, 'exp-main-7': 10, 'exp-main-8': 5,
  'exp-main-9': 5, 'exp-main-10': 0,
});

const addMonths = (date, months) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return d;
};

export const initializeProject = async (dispatch, payload, user, existingTiersData, currency) => {
  try {
    // Defensively check for and create profile if it doesn't exist
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') { // "Not found"
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id });
      if (insertError) {
        console.error("Error creating profile during onboarding:", insertError);
        throw insertError;
      }
    } else if (profileError) {
      console.error("Error checking for profile:", profileError);
      throw profileError;
    }

    const { projectName, projectStartDate, cashAccounts, entries, monthlyRevenue, monthlyExpense, loans, borrowings } = payload;
    
    // 1. Create Project
    const { data: newProjectData, error: projectError } = await supabase
        .from('projects')
        .insert({
            user_id: user.id, name: projectName, start_date: projectStartDate, currency: currency,
            annual_goals: { [new Date().getFullYear()]: { revenue: (parseFloat(monthlyRevenue) || 0) * 12, expense: (parseFloat(monthlyExpense) || 0) * 12 } },
            expense_targets: getDefaultExpenseTargets(),
        })
        .select().single();
    if (projectError) throw projectError;

    // 2. Create Cash Accounts
    const { data: newCashAccountsData, error: cashAccountsError } = await supabase
        .from('cash_accounts')
        .insert(cashAccounts.map(acc => ({
            project_id: newProjectData.id, user_id: user.id, main_category_id: acc.mainCategoryId,
            name: acc.name, initial_balance: acc.initialBalance, initial_balance_date: acc.initialBalanceDate,
        })))
        .select();
    if (cashAccountsError) throw cashAccountsError;
    
    // 3. Handle Tiers
    const existingTiers = new Set((existingTiersData || []).map(t => t.name.toLowerCase()));
    const newTiersToCreate = new Set();
    const allEntriesAndLoans = [...entries, ...loans, ...borrowings];
    allEntriesAndLoans.forEach(item => {
        const tierName = item.supplier || item.thirdParty;
        if (tierName && !existingTiers.has(tierName.toLowerCase())) {
            const type = item.type === 'revenu' || item.type === 'loan' ? 'client' : 'fournisseur';
            newTiersToCreate.add(JSON.stringify({ name: tierName, type, user_id: user.id }));
        }
    });
    let createdTiers = [];
    if (newTiersToCreate.size > 0) {
        const { data: insertedTiers, error: tiersError } = await supabase.from('tiers').upsert(Array.from(newTiersToCreate).map(t => JSON.parse(t)), { onConflict: 'user_id,name,type' }).select();
        if (tiersError) throw tiersError;
        createdTiers = insertedTiers;
    }

    // 4. Create Budget Entries
    const { data: newEntriesData, error: entriesError } = await supabase
        .from('budget_entries')
        .insert(entries.map(entry => ({
            project_id: newProjectData.id, user_id: user.id, type: entry.type, category: entry.category,
            frequency: entry.frequency, amount: entry.amount, date: entry.date, start_date: entry.startDate,
            supplier: entry.supplier, description: entry.description,
        })))
        .select();
    if (entriesError) throw entriesError;

    // 5. Create Actuals from entries
    let newActualsToInsert = [];
    newEntriesData.forEach(entry => {
        const actuals = deriveActualsFromEntry(entry, newProjectData.id, newCashAccountsData);
        newActualsToInsert.push(...actuals);
    });

    // 6. Loans and their entries/actuals
    const allLoans = [...borrowings, ...loans];
    let newLoans = [];
    if (allLoans.length > 0) {
        const loansToInsert = allLoans.map(l => ({
            project_id: newProjectData.id, user_id: user.id, type: l.type, third_party: l.thirdParty,
            principal: parseFloat(l.principal), monthly_payment: parseFloat(l.monthlyPayment), term: parseInt(l.term, 10),
            principal_date: l.principalDate, repayment_start_date: l.repaymentStartDate,
        }));
        const { data: insertedLoans, error: loansError } = await supabase.from('loans').insert(loansToInsert).select();
        if (loansError) throw loansError;
        newLoans = insertedLoans;

        const loanEntriesToInsert = [];
        for (const loan of newLoans) {
            loanEntriesToInsert.push({
                project_id: loan.project_id, user_id: user.id, loan_id: loan.id, type: loan.type === 'borrowing' ? 'revenu' : 'depense',
                category: loan.type === 'borrowing' ? 'Réception Emprunt' : 'Octroi de Prêt', frequency: 'ponctuel', amount: loan.principal,
                date: loan.principal_date, supplier: loan.third_party, description: `Principal pour prêt/emprunt`
            });
            loanEntriesToInsert.push({
                project_id: loan.project_id, user_id: user.id, loan_id: loan.id, type: loan.type === 'borrowing' ? 'depense' : 'revenu',
                category: loan.type === 'borrowing' ? 'Remboursement d\'emprunt' : 'Remboursement de prêt reçu', frequency: 'mensuel',
                amount: loan.monthly_payment, start_date: loan.repayment_start_date,
                end_date: addMonths(new Date(loan.repayment_start_date), loan.term - 1).toISOString().split('T')[0],
                supplier: loan.third_party, description: `Remboursement prêt/emprunt`
            });
        }
        const { data: insertedLoanEntries, error: loanEntriesError } = await supabase.from('budget_entries').insert(loanEntriesToInsert).select();
        if (loanEntriesError) throw loanEntriesError;

        for (const entry of insertedLoanEntries) {
            const actuals = deriveActualsFromEntry(entry, entry.project_id, newCashAccountsData);
            newActualsToInsert.push(...actuals);
        }
    }

    // Batch insert all actuals
    if (newActualsToInsert.length > 0) {
        const { error: actualsError } = await supabase.from('actual_transactions').insert(newActualsToInsert.map(a => ({
            id: a.id, budget_id: a.budgetId, project_id: a.projectId, user_id: user.id, type: a.type,
            category: a.category, third_party: a.thirdParty, description: a.description, date: a.date,
            amount: a.amount, status: a.status, is_off_budget: a.isOffBudget, is_provision: a.isProvision,
            is_final_provision_payment: a.isFinalProvisionPayment, provision_details: a.provisionDetails,
            is_internal_transfer: a.isInternalTransfer,
        })));
        if (actualsError) throw actualsError;
    }
    
    dispatch({ 
        type: 'INITIALIZE_PROJECT_SUCCESS', 
        payload: {
            newProject: {
                id: newProjectData.id, name: newProjectData.name, currency: newProjectData.currency,
                startDate: newProjectData.start_date, isArchived: newProjectData.is_archived,
                annualGoals: newProjectData.annual_goals, expenseTargets: newProjectData.expense_targets
            },
            finalCashAccounts: newCashAccountsData.map(acc => ({
                id: acc.id, projectId: acc.project_id, mainCategoryId: acc.main_category_id,
                name: acc.name, initialBalance: acc.initial_balance, initialBalanceDate: acc.initial_balance_date,
                isClosed: acc.is_closed, closureDate: acc.closure_date
            })),
            newAllEntries: newEntriesData.map(entry => ({
              id: entry.id, loanId: entry.loan_id, type: entry.type, category: entry.category, frequency: entry.frequency,
              amount: entry.amount, date: entry.date, startDate: entry.start_date, endDate: entry.end_date,
              supplier: entry.supplier, description: entry.description, isOffBudget: entry.is_off_budget,
              payments: entry.payments, provisionDetails: entry.provisionDetails
            })),
            newAllActuals: newActualsToInsert.map(a => ({
                ...a,
                payments: []
            })),
            newTiers: createdTiers.map(t => ({ id: t.id, name: t.name, type: t.type })),
            newLoans: newLoans.map(l => ({
                id: l.id, projectId: l.project_id, type: l.type, thirdParty: l.third_party, principal: l.principal, term: l.term,
                monthlyPayment: l.monthly_payment, principalDate: l.principal_date, repaymentStartDate: l.repayment_start_date
            })),
        }
    });
    
  } catch (error) {
    console.error("Onboarding failed:", error);
    dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la création du projet: ${error.message}`, type: 'error' } });
    throw error;
  }
};

export const saveEntry = async (dispatch, { entryData, editingEntry, activeProjectId, tiers, user, cashAccounts }) => {
    try {
        const { supplier, type } = entryData;
        const tierType = type === 'revenu' ? 'client' : 'fournisseur';
        const existingTier = tiers.find(t => t.name.toLowerCase() === supplier.toLowerCase());
        let newTierData = null;

        if (!existingTier && supplier) {
            const { data: insertedTier, error: tierError } = await supabase
                .from('tiers')
                .upsert({ name: supplier, type: tierType, user_id: user.id }, { onConflict: 'user_id,name,type' })
                .select()
                .single();
            if (tierError) throw tierError;
            newTierData = insertedTier;
        }

        const finalEntryDataForDB = {
            project_id: activeProjectId,
            user_id: user.id,
            type: entryData.type,
            category: entryData.category,
            frequency: entryData.frequency,
            amount: entryData.amount,
            date: entryData.date,
            start_date: entryData.startDate,
            end_date: entryData.endDate,
            supplier: entryData.supplier,
            description: entryData.description,
            is_off_budget: entryData.isOffBudget || false,
            payments: entryData.payments,
            provision_details: entryData.provisionDetails,
        };

        let savedEntryFromDB;
        if (editingEntry) {
            const { data, error } = await supabase
                .from('budget_entries')
                .update(finalEntryDataForDB)
                .eq('id', editingEntry.id)
                .select()
                .single();
            if (error) throw error;
            savedEntryFromDB = data;
        } else {
            const { data, error } = await supabase
                .from('budget_entries')
                .insert(finalEntryDataForDB)
                .select()
                .single();
            if (error) throw error;
            savedEntryFromDB = data;
        }
        
        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        const { error: deleteError } = await supabase
            .from('actual_transactions')
            .delete()
            .eq('budget_id', savedEntryFromDB.id)
            .in('status', unsettledStatuses);
        if (deleteError) throw deleteError;

        const savedEntryForClient = {
            id: savedEntryFromDB.id,
            loanId: savedEntryFromDB.loan_id,
            type: savedEntryFromDB.type,
            category: savedEntryFromDB.category,
            frequency: savedEntryFromDB.frequency,
            amount: savedEntryFromDB.amount,
            date: savedEntryFromDB.date,
            startDate: savedEntryFromDB.start_date,
            endDate: savedEntryFromDB.end_date,
            supplier: savedEntryFromDB.supplier,
            description: savedEntryFromDB.description,
            isOffBudget: savedEntryFromDB.is_off_budget,
            payments: savedEntryFromDB.payments,
            provisionDetails: savedEntryFromDB.provision_details,
        };

        const newActuals = deriveActualsFromEntry(savedEntryForClient, activeProjectId, cashAccounts);
        
        if (newActuals.length > 0) {
            const { error: insertError } = await supabase
                .from('actual_transactions')
                .insert(newActuals.map(a => ({
                    id: a.id,
                    budget_id: a.budgetId,
                    project_id: a.projectId,
                    user_id: user.id,
                    type: a.type,
                    category: a.category,
                    third_party: a.thirdParty,
                    description: a.description,
                    date: a.date,
                    amount: a.amount,
                    status: a.status,
                    is_off_budget: a.isOffBudget,
                    is_provision: a.isProvision,
                    is_final_provision_payment: a.isFinalProvisionPayment,
                    provision_details: a.provisionDetails,
                    is_internal_transfer: a.isInternalTransfer,
                })));
            if (insertError) throw insertError;
        }

        dispatch({
            type: 'SAVE_ENTRY_SUCCESS',
            payload: {
                savedEntry: savedEntryForClient,
                newActuals: newActuals,
                targetProjectId: activeProjectId,
                newTier: newTierData ? { id: newTierData.id, name: newTierData.name, type: newTierData.type } : null,
            }
        });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Entrée budgétaire enregistrée.', type: 'success' } });

    } catch (error) {
        console.error("Error saving entry:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de l'enregistrement: ${error.message}`, type: 'error' } });
    }
};

export const updateSettings = async (dispatch, user, newSettings) => {
    if (!user) {
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Utilisateur non authentifié.', type: 'error' } });
        return;
    }
    try {
        const updates = {
            currency: newSettings.currency,
            display_unit: newSettings.displayUnit,
            decimal_places: newSettings.decimalPlaces,
            language: newSettings.language,
            timezone_offset: newSettings.timezoneOffset
        };

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;

        const updatedSettings = {
            currency: data.currency,
            displayUnit: data.display_unit,
            decimalPlaces: data.decimal_places,
            language: data.language,
            timezoneOffset: data.timezone_offset,
        };
        dispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: updatedSettings });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Préférences mises à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating settings:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const updateUserCashAccount = async (dispatch, { projectId, accountId, accountData }) => {
    try {
        const updates = {
            name: accountData.name,
            initial_balance: accountData.initialBalance,
            initial_balance_date: accountData.initialBalanceDate,
        };

        const { data, error } = await supabase
            .from('cash_accounts')
            .update(updates)
            .eq('id', accountId)
            .select()
            .single();

        if (error) throw error;

        dispatch({
            type: 'UPDATE_USER_CASH_ACCOUNT_SUCCESS',
            payload: {
                projectId,
                accountId,
                accountData: {
                    name: data.name,
                    initialBalance: data.initial_balance,
                    initialBalanceDate: data.initial_balance_date,
                }
            }
        });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Compte mis à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating cash account:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveActual = async (dispatch, { actualData, editingActual, user, tiers }) => {
  try {
    const { thirdParty, type } = actualData;
    const tierType = type === 'receivable' ? 'client' : 'fournisseur';
    let newTierData = null;

    const existingTier = tiers.find(t => t.name.toLowerCase() === thirdParty.toLowerCase());
    if (!existingTier && thirdParty) {
      const { data: insertedTier, error: tierError } = await supabase
        .from('tiers')
        .upsert({ name: thirdParty, type: tierType, user_id: user.id }, { onConflict: 'user_id,name,type' })
        .select().single();
      if (tierError) throw tierError;
      newTierData = insertedTier;
    }
    
    const dataToSave = {
      project_id: actualData.projectId,
      user_id: user.id,
      type: actualData.type,
      category: actualData.category,
      third_party: actualData.thirdParty,
      description: actualData.description,
      date: actualData.date,
      amount: actualData.amount,
      status: actualData.status,
      is_off_budget: actualData.isOffBudget,
    };

    let savedActual;
    if (editingActual) {
      const { data, error } = await supabase.from('actual_transactions').update(dataToSave).eq('id', editingActual.id).select().single();
      if (error) throw error;
      savedActual = data;
    } else {
      const { data, error } = await supabase.from('actual_transactions').insert(dataToSave).select().single();
      if (error) throw error;
      savedActual = data;
    }

    const finalActualData = {
        id: savedActual.id,
        budgetId: savedActual.budget_id,
        projectId: savedActual.project_id,
        type: savedActual.type,
        category: savedActual.category,
        thirdParty: savedActual.third_party,
        description: savedActual.description,
        date: savedActual.date,
        amount: savedActual.amount,
        status: savedActual.status,
        isOffBudget: savedActual.is_off_budget,
        payments: []
    };

    dispatch({
      type: 'SAVE_ACTUAL_SUCCESS',
      payload: {
        finalActualData,
        newTier: newTierData ? { id: newTierData.id, name: newTierData.name, type: newTierData.type } : null,
      }
    });
    dispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction enregistrée.', type: 'success' } });

  } catch (error) {
    console.error("Error saving actual transaction:", error);
    dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

export const deleteActual = async (dispatch, actualId) => {
    try {
        const { error } = await supabase.from('actual_transactions').delete().eq('id', actualId);
        if (error) throw error;
        dispatch({ type: 'DELETE_ACTUAL_SUCCESS', payload: actualId });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction supprimée.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting actual:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const recordPayment = async (dispatch, { actualId, paymentData, allActuals }) => {
    try {
        const { data: payment, error: paymentError } = await supabase.from('payments').insert({
            actual_id: actualId,
            payment_date: paymentData.paymentDate,
            paid_amount: paymentData.paidAmount,
            cash_account: paymentData.cashAccount,
        }).select().single();
        if (paymentError) throw paymentError;

        const actual = Object.values(allActuals).flat().find(a => a.id === actualId);
        const totalPaid = (actual.payments || []).reduce((sum, p) => sum + p.paidAmount, 0) + paymentData.paidAmount;
        let newStatus = actual.status;
        if (paymentData.isFinalPayment || totalPaid >= actual.amount) {
            newStatus = actual.type === 'payable' ? 'paid' : 'received';
        } else if (totalPaid > 0) {
            newStatus = actual.type === 'payable' ? 'partially_paid' : 'partially_received';
        }

        const { data: updatedActual, error: actualError } = await supabase
            .from('actual_transactions')
            .update({ status: newStatus })
            .eq('id', actualId)
            .select('*, payments(*)')
            .single();
        if (actualError) throw actualError;

        dispatch({ type: 'RECORD_PAYMENT_SUCCESS', payload: { updatedActual } });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Paiement enregistré.', type: 'success' } });
    } catch (error) {
        console.error("Error recording payment:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const writeOffActual = async (dispatch, actualId) => {
    try {
        const { data: updatedActual, error } = await supabase
            .from('actual_transactions')
            .update({ 
                status: 'written_off',
                description: `(Write-off) ${new Date().toLocaleDateString()}` 
            })
            .eq('id', actualId)
            .select()
            .single();

        if (error) throw error;
        
        dispatch({ type: 'WRITE_OFF_ACTUAL_SUCCESS', payload: updatedActual });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction passée en perte.', type: 'success' } });

    } catch (error) {
        console.error("Error writing off actual:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveConsolidatedView = async (dispatch, { viewData, editingView, user }) => {
  try {
    const dataToSave = {
      user_id: user.id,
      name: viewData.name,
      project_ids: viewData.project_ids,
    };

    let savedView;
    if (editingView) {
      const { data, error } = await supabase
        .from('consolidated_views')
        .update(dataToSave)
        .eq('id', editingView.id)
        .select()
        .single();
      if (error) throw error;
      savedView = data;
      dispatch({ type: 'UPDATE_CONSOLIDATED_VIEW_SUCCESS', payload: { id: savedView.id, name: savedView.name, project_ids: savedView.project_ids } });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée mise à jour.', type: 'success' } });
    } else {
      const { data, error } = await supabase
        .from('consolidated_views')
        .insert(dataToSave)
        .select()
        .single();
      if (error) throw error;
      savedView = data;
      dispatch({ type: 'ADD_CONSOLIDATED_VIEW_SUCCESS', payload: { id: savedView.id, name: savedView.name, project_ids: savedView.project_ids } });
      dispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée créée.', type: 'success' } });
    }
    dispatch({ type: 'CLOSE_CONSOLIDATED_VIEW_MODAL' });
  } catch (error) {
    console.error("Error saving consolidated view:", error);
    dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

export const deleteConsolidatedView = async (dispatch, viewId) => {
    try {
        const { error } = await supabase.from('consolidated_views').delete().eq('id', viewId);
        if (error) throw error;
        dispatch({ type: 'DELETE_CONSOLIDATED_VIEW_SUCCESS', payload: viewId });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée supprimée.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting consolidated view:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const inviteCollaborator = async (dispatch, { email, role, permissionScope, projectIds, ownerId }) => {
    try {
        const { data, error } = await supabase
            .from('collaborators')
            .insert({
                owner_id: ownerId,
                email,
                role,
                permission_scope: permissionScope,
                project_ids: projectIds,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Optionally, trigger a Supabase Edge Function to send an email invite
        // await supabase.functions.invoke('send-invite-email', { body: { email, ownerName } });

        dispatch({
            type: 'INVITE_COLLABORATOR_SUCCESS',
            payload: {
                id: data.id,
                ownerId: data.owner_id,
                userId: data.user_id,
                email: data.email,
                role: data.role,
                status: data.status,
                projectIds: data.project_ids,
                permissionScope: data.permission_scope,
            }
        });
        dispatch({ type: 'ADD_TOAST', payload: { message: `Invitation envoyée à ${email}.`, type: 'success' } });
    } catch (error) {
        console.error("Error inviting collaborator:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const revokeCollaborator = async (dispatch, collaboratorId) => {
    try {
        const { error } = await supabase.from('collaborators').delete().eq('id', collaboratorId);
        if (error) throw error;
        dispatch({ type: 'REVOKE_COLLABORATOR_SUCCESS', payload: collaboratorId });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Accès révoqué.', type: 'success' } });
    } catch (error) {
        console.error("Error revoking collaborator access:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

const SCENARIO_COLORS = ['#8b5cf6', '#f97316', '#d946ef'];

export const saveScenario = async (dispatch, { scenarioData, editingScenario, activeProjectId, user, existingScenariosCount }) => {
    try {
        let savedScenario;
        if (editingScenario) {
            const dataToUpdate = {
                name: scenarioData.name,
                description: scenarioData.description,
            };
            const { data, error } = await supabase
                .from('scenarios')
                .update(dataToUpdate)
                .eq('id', editingScenario.id)
                .select()
                .single();
            if (error) throw error;
            savedScenario = data;
            dispatch({ type: 'UPDATE_SCENARIO_SUCCESS', payload: {
                id: savedScenario.id,
                projectId: savedScenario.project_id,
                name: savedScenario.name,
                description: savedScenario.description,
                color: savedScenario.color,
                isVisible: savedScenario.is_visible,
                isArchived: savedScenario.is_archived
            }});
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario mis à jour.', type: 'success' } });
        } else {
            const dataToInsert = {
                project_id: activeProjectId,
                user_id: user.id,
                name: scenarioData.name,
                description: scenarioData.description,
                color: SCENARIO_COLORS[existingScenariosCount % SCENARIO_COLORS.length],
                is_visible: true,
            };
            const { data, error } = await supabase
                .from('scenarios')
                .insert(dataToInsert)
                .select()
                .single();
            if (error) throw error;
            savedScenario = data;
            dispatch({ type: 'ADD_SCENARIO_SUCCESS', payload: {
                id: savedScenario.id,
                projectId: savedScenario.project_id,
                name: savedScenario.name,
                description: savedScenario.description,
                color: savedScenario.color,
                isVisible: savedScenario.is_visible,
                isArchived: savedScenario.is_archived
            }});
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario créé.', type: 'success' } });
        }
    } catch (error) {
        console.error("Error saving scenario:", error);
        dispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la sauvegarde du scénario: ${error.message}`, type: 'error' } });
    }
};
