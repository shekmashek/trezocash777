import { supabase } from '../utils/supabase';
import { deriveActualsFromEntry } from '../utils/scenarioCalculations';
import { templates as officialTemplatesData } from '../utils/templates';
import { v4 as uuidv4 } from 'uuid';

const getDefaultExpenseTargets = () => ({
  'exp-main-1': 20, 'exp-main-2': 35, 'exp-main-3': 10, 'exp-main-4': 0,
  'exp-main-5': 10, 'exp-main-6': 5, 'exp-main-7': 10, 'exp-main-8': 5,
  'exp-main-9': 5, 'exp-main-10': 0,
});

export const initializeProject = async ({ dataDispatch, uiDispatch }, payload, user, existingTiersData, allTemplates) => {
  try {
    const { projectName, projectStartDate, projectEndDate, isEndDateIndefinite, templateId, startOption } = payload;
    
    const { data: newProjectData, error: projectError } = await supabase
        .from('projects')
        .insert({
            user_id: user.id,
            name: projectName,
            start_date: projectStartDate,
            end_date: isEndDateIndefinite ? null : projectEndDate,
            currency: '€',
            expense_targets: getDefaultExpenseTargets(),
        })
        .select().single();
    if (projectError) throw projectError;

    const projectId = newProjectData.id;

    if (startOption === 'blank' || templateId === 'blank') {
        const { data: defaultAccount, error: accountError } = await supabase
            .from('cash_accounts')
            .insert({
                project_id: projectId, user_id: user.id, main_category_id: 'bank',
                name: 'Compte Principal', initial_balance: 0, initial_balance_date: projectStartDate,
            })
            .select().single();
        if (accountError) throw accountError;

        dataDispatch({ 
            type: 'INITIALIZE_PROJECT_SUCCESS', 
            payload: {
                newProject: {
                    id: projectId, name: projectName, currency: '€', startDate: projectStartDate, endDate: isEndDateIndefinite ? null : projectEndDate,
                    isArchived: false, annualGoals: {}, expenseTargets: getDefaultExpenseTargets()
                },
                finalCashAccounts: [{
                    id: defaultAccount.id, projectId: projectId, mainCategoryId: 'bank',
                    name: 'Compte Principal', initialBalance: 0, initialBalanceDate: projectStartDate,
                    isClosed: false, closureDate: null
                }],
                newAllEntries: [], newAllActuals: [], newTiers: [], newLoans: [], newCategories: null,
            }
        });
        uiDispatch({ type: 'CANCEL_ONBOARDING' });
        return;
    }

    const officialTemplate = [...officialTemplatesData.personal, ...officialTemplatesData.professional].find(t => t.id === templateId);
    const customTemplate = allTemplates.find(t => t.id === templateId);
    
    let templateData;
    let newCategories = null;
    if (officialTemplate) {
        templateData = officialTemplate.data;
    } else if (customTemplate) {
        templateData = customTemplate.structure;
        newCategories = customTemplate.structure.categories;
    } else {
        throw new Error("Template not found");
    }

    const { data: newCashAccountsData, error: cashAccountsError } = await supabase
        .from('cash_accounts')
        .insert(templateData.cashAccounts.map(acc => ({
            project_id: projectId, user_id: user.id, main_category_id: acc.mainCategoryId,
            name: acc.name, initial_balance: acc.initialBalance, initial_balance_date: projectStartDate,
        })))
        .select();
    if (cashAccountsError) throw cashAccountsError;

    const allTiersFromTemplate = [...templateData.entries, ...(templateData.loans || []), ...(templateData.borrowings || [])]
        .map(item => item.supplier || item.thirdParty).filter(Boolean);
    const uniqueTiers = [...new Set(allTiersFromTemplate)];
    
    let createdTiers = [];
    if (uniqueTiers.length > 0) {
        const tiersToInsert = uniqueTiers.map(name => ({ name, type: 'fournisseur', user_id: user.id }));
        const { data: insertedTiers, error: tiersError } = await supabase.from('tiers').upsert(tiersToInsert, { onConflict: 'user_id,name,type' }).select();
        if (tiersError) throw tiersError;
        createdTiers = insertedTiers;
    }

    const today = new Date().toISOString().split('T')[0];
    const entriesToInsert = templateData.entries.map(entry => ({
        project_id: projectId, user_id: user.id, type: entry.type, category: entry.category,
        frequency: entry.frequency, amount: entry.amount, 
        date: entry.frequency === 'ponctuel' ? (entry.date || today) : null,
        start_date: entry.frequency !== 'ponctuel' ? (entry.startDate || today) : null,
        supplier: entry.supplier, description: entry.description,
    }));
    const { data: newEntriesData, error: entriesError } = await supabase
        .from('budget_entries')
        .insert(entriesToInsert)
        .select();
    if (entriesError) throw entriesError;

    let newActualsToInsert = [];
    newEntriesData.forEach(entry => {
        const actuals = deriveActualsFromEntry(entry, projectId, newCashAccountsData);
        newActualsToInsert.push(...actuals);
    });

    if (newActualsToInsert.length > 0) {
        const { error: actualsError } = await supabase.from('actual_transactions').insert(newActualsToInsert.map(a => ({
            id: a.id, budget_id: a.budgetId, project_id: a.projectId, user_id: user.id, type: a.type,
            category: a.category, third_party: a.thirdParty, description: a.description, date: a.date,
            amount: a.amount, status: a.status
        })));
        if (actualsError) throw actualsError;
    }
    
    dataDispatch({ 
        type: 'INITIALIZE_PROJECT_SUCCESS', 
        payload: {
            newProject: {
                id: projectId, name: projectName, currency: '€', startDate: projectStartDate, endDate: isEndDateIndefinite ? null : projectEndDate,
                isArchived: false, annualGoals: {}, expenseTargets: getDefaultExpenseTargets()
            },
            finalCashAccounts: newCashAccountsData.map(acc => ({
                id: acc.id, projectId: acc.project_id, mainCategoryId: acc.main_category_id,
                name: acc.name, initialBalance: acc.initial_balance, initialBalanceDate: acc.initial_balance_date,
                isClosed: acc.is_closed, closureDate: acc.closure_date
            })),
            newAllEntries: newEntriesData.map(entry => ({
              id: entry.id, type: entry.type, category: entry.category, frequency: entry.frequency,
              amount: entry.amount, date: entry.date, startDate: entry.start_date,
              supplier: entry.supplier, description: entry.description
            })),
            newAllActuals: newActualsToInsert.map(a => ({ ...a, payments: [] })),
            newTiers: createdTiers.map(t => ({ id: t.id, name: t.name, type: t.type })),
            newLoans: [],
            newCategories,
        }
    });
    uiDispatch({ type: 'CANCEL_ONBOARDING' });

  } catch (error) {
    console.error("Onboarding failed:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la création du projet: ${error.message}`, type: 'error' } });
    throw error;
  }
};

export const updateProjectSettings = async ({ dataDispatch, uiDispatch }, { projectId, newSettings }) => {
    try {
        const updates = {
            name: newSettings.name,
            start_date: newSettings.startDate,
            end_date: newSettings.endDate,
            currency: newSettings.currency,
            display_unit: newSettings.display_unit,
            decimal_places: newSettings.decimal_places,
        };

        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;

        dataDispatch({
            type: 'UPDATE_PROJECT_SETTINGS_SUCCESS',
            payload: {
                projectId,
                newSettings: {
                    name: data.name,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    currency: data.currency,
                    display_unit: data.display_unit,
                    decimal_places: data.decimal_places,
                }
            }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Paramètres du projet mis à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating project settings:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveEntry = async ({ dataDispatch, uiDispatch }, { entryData, editingEntry, activeProjectId, tiers, user, cashAccounts }) => {
    try {
        const { supplier, type } = entryData;
        const tierType = type === 'revenu' ? 'client' : 'fournisseur';
        const existingTier = tiers.find(t => t.name.toLowerCase() === supplier.toLowerCase() && t.type === tierType);
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
            project_id: entryData.projectId || activeProjectId,
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
            is_provision: entryData.isProvision,
        };

        let savedEntryFromDB;
        if (editingEntry && editingEntry.id) {
            const { data, error } = await supabase
                .from('budget_entries')
                .update(finalEntryDataForDB)
                .eq('id', editingEntry.id)
                .select()
                .single();
            if (error) {
                console.error("Supabase update error:", error);
                throw error;
            }
            savedEntryFromDB = data;
        } else {
            const { data, error } = await supabase
                .from('budget_entries')
                .insert(finalEntryDataForDB)
                .select()
                .single();
            if (error) {
                console.error("Supabase insert error:", error);
                throw error;
            }
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
            isProvision: savedEntryFromDB.is_provision,
        };

        const tier = existingTier || newTierData;
        const paymentTerms = tier?.payment_terms;

        const newActuals = deriveActualsFromEntry(savedEntryForClient, savedEntryFromDB.project_id, cashAccounts, paymentTerms);
        
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

        dataDispatch({
            type: 'SAVE_ENTRY_SUCCESS',
            payload: {
                savedEntry: savedEntryForClient,
                newActuals: newActuals,
                targetProjectId: savedEntryFromDB.project_id,
                newTier: newTierData ? { id: newTierData.id, name: newTierData.name, type: newTierData.type } : null,
            }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Entrée budgétaire enregistrée.', type: 'success' } });
        uiDispatch({ type: 'CLOSE_BUDGET_MODAL' });

    } catch (error) {
        console.error("Error saving entry:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de l'enregistrement: ${error.message}`, type: 'error' } });
    }
};

export const deleteEntry = async ({ dataDispatch, uiDispatch }, { entryId, entryProjectId }) => {
    try {
        if (!entryProjectId || entryProjectId === 'consolidated' || entryProjectId.startsWith('consolidated_view_')) {
            uiDispatch({ type: 'ADD_TOAST', payload: { message: "Impossible de supprimer une entrée en vue consolidée.", type: 'error' } });
            return;
        }

        const unsettledStatuses = ['pending', 'partially_paid', 'partially_received'];
        await supabase
            .from('actual_transactions')
            .delete()
            .eq('budget_id', entryId)
            .in('status', unsettledStatuses);
        
        const { error: deleteEntryError } = await supabase
            .from('budget_entries')
            .delete()
            .eq('id', entryId);

        if (deleteEntryError) throw deleteEntryError;

        dataDispatch({
            type: 'DELETE_ENTRY_SUCCESS',
            payload: { entryId, entryProjectId }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Entrée budgétaire supprimée.', type: 'success' } });
        uiDispatch({ type: 'CLOSE_BUDGET_MODAL' });

    } catch (error) {
        console.error("Error deleting entry:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la suppression: ${error.message}`, type: 'error' } });
    }
};

export const updateSettings = async ({ dataDispatch, uiDispatch }, user, newSettings) => {
    if (!user) {
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Utilisateur non authentifié.', type: 'error' } });
        return;
    }
    try {
        const updates = {
            currency: newSettings.currency,
            display_unit: newSettings.displayUnit,
            decimal_places: newSettings.decimalPlaces,
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
            timezoneOffset: data.timezone_offset,
        };
        dataDispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: updatedSettings });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Préférences mises à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating settings:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const updateUserCashAccount = async ({ dataDispatch, uiDispatch }, { projectId, accountId, accountData }) => {
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

        dataDispatch({
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
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Compte mis à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating cash account:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveActual = async ({ dataDispatch, uiDispatch }, { actualData, editingActual, user, tiers }) => {
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

    dataDispatch({
      type: 'SAVE_ACTUAL_SUCCESS',
      payload: {
        finalActualData,
        newTier: newTierData ? { id: newTierData.id, name: newTierData.name, type: newTierData.type } : null,
      }
    });
    uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction enregistrée.', type: 'success' } });
    uiDispatch({ type: 'CLOSE_ACTUAL_TRANSACTION_MODAL' });

  } catch (error) {
    console.error("Error saving actual transaction:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

export const deleteActual = async ({ dataDispatch, uiDispatch }, actualId) => {
    try {
        const { error } = await supabase.from('actual_transactions').delete().eq('id', actualId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_ACTUAL_SUCCESS', payload: actualId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction supprimée.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting actual:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const recordPayment = async ({ dataDispatch, uiDispatch }, { actualId, paymentData, allActuals, user }) => {
    try {
        if (!user || !user.id) {
            throw new Error("ID utilisateur manquant.");
        }
        const { data: payment, error: paymentError } = await supabase.from('payments').insert({
            actual_id: actualId,
            user_id: user.id,
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

        dataDispatch({ type: 'RECORD_PAYMENT_SUCCESS', payload: { updatedActual } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Paiement enregistré.', type: 'success' } });
        uiDispatch({ type: 'CLOSE_PAYMENT_MODAL' });
    } catch (error) {
        console.error("Error recording payment:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const writeOffActual = async ({ dataDispatch, uiDispatch }, actualId) => {
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
        
        dataDispatch({ type: 'WRITE_OFF_ACTUAL_SUCCESS', payload: updatedActual });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Transaction passée en perte.', type: 'success' } });

    } catch (error) {
        console.error("Error writing off actual:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveConsolidatedView = async ({ dataDispatch, uiDispatch }, { viewData, editingView, user }) => {
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
      dataDispatch({ type: 'UPDATE_CONSOLIDATED_VIEW_SUCCESS', payload: { id: savedView.id, name: savedView.name, project_ids: savedView.project_ids } });
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée mise à jour.', type: 'success' } });
    } else {
      const { data, error } = await supabase
        .from('consolidated_views')
        .insert(dataToSave)
        .select()
        .single();
      if (error) throw error;
      savedView = data;
      dataDispatch({ type: 'ADD_CONSOLIDATED_VIEW_SUCCESS', payload: { id: savedView.id, name: savedView.name, project_ids: savedView.project_ids } });
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée créée.', type: 'success' } });
    }
    uiDispatch({ type: 'CLOSE_CONSOLIDATED_VIEW_MODAL' });
  } catch (error) {
    console.error("Error saving consolidated view:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

export const deleteConsolidatedView = async ({ dataDispatch, uiDispatch }, viewId) => {
    try {
        const { error } = await supabase.from('consolidated_views').delete().eq('id', viewId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_CONSOLIDATED_VIEW_SUCCESS', payload: viewId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Vue consolidée supprimée.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting consolidated view:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const inviteCollaborator = async ({ dataDispatch, uiDispatch }, { email, role, permissionScope, projectIds, ownerId }) => {
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

        dataDispatch({
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
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Invitation envoyée à ${email}.`, type: 'success' } });
    } catch (error) {
        console.error("Error inviting collaborator:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const revokeCollaborator = async ({ dataDispatch, uiDispatch }, collaboratorId) => {
    try {
        const { error } = await supabase.from('collaborators').delete().eq('id', collaboratorId);
        if (error) throw error;
        dataDispatch({ type: 'REVOKE_COLLABORATOR_SUCCESS', payload: collaboratorId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Accès révoqué.', type: 'info' } });
    } catch (error) {
        console.error("Error revoking collaborator access:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const acceptInvite = async ({ dataDispatch, uiDispatch }, invite, user) => {
    try {
        const { error: updateError } = await supabase
            .from('collaborators')
            .update({ status: 'accepted', user_id: user.id })
            .eq('id', invite.id);

        if (updateError) throw updateError;
        
        const { data: updatedData, error: selectError } = await supabase
            .from('collaborators')
            .select('*')
            .eq('id', invite.id)
            .single();
        
        if (selectError) throw selectError;

        const { data: ownerProfile, error: ownerError } = await supabase
            .from('profiles')
            .select('notifications')
            .eq('id', invite.ownerId)
            .single();
        if (ownerError) throw ownerError;

        const firstProjectId = invite.projectIds?.[0];
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('name')
            .eq('id', firstProjectId)
            .single();
        if (projectError) throw projectError;

        const newNotification = {
            id: uuidv4(),
            type: 'invite_response',
            status: 'accepted',
            collaboratorName: user.user_metadata.full_name || user.email,
            collaboratorEmail: user.email,
            projectName: project.name,
            timestamp: new Date().toISOString(),
        };

        const updatedNotifications = [...(ownerProfile.notifications || []), newNotification];
        await supabase.from('profiles').update({ notifications: updatedNotifications }).eq('id', invite.ownerId);

        const acceptedInvite = {
            id: updatedData.id,
            ownerId: updatedData.owner_id,
            userId: updatedData.user_id,
            email: updatedData.email,
            role: updatedData.role,
            status: updatedData.status,
            projectIds: updatedData.project_ids,
            permissionScope: updatedData.permission_scope,
        };

        dataDispatch({ type: 'ACCEPT_INVITE_SUCCESS', payload: acceptedInvite });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Invitation acceptée !', type: 'success' } });
    } catch (error) {
        console.error("Error accepting invite:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const declineInvite = async ({ dataDispatch, uiDispatch }, invite, user) => {
    try {
        const { data: ownerProfile, error: ownerError } = await supabase
            .from('profiles')
            .select('notifications')
            .eq('id', invite.ownerId)
            .single();
        if (ownerError) throw ownerError;

        const firstProjectId = invite.projectIds?.[0];
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('name')
            .eq('id', firstProjectId)
            .single();
        if (projectError) throw projectError;

        const newNotification = {
            id: uuidv4(),
            type: 'invite_response',
            status: 'declined',
            collaboratorName: user.user_metadata.full_name || user.email,
            collaboratorEmail: user.email,
            projectName: project.name,
            timestamp: new Date().toISOString(),
        };

        const updatedNotifications = [...(ownerProfile.notifications || []), newNotification];
        await supabase.from('profiles').update({ notifications: updatedNotifications }).eq('id', invite.ownerId);

        const { error } = await supabase.from('collaborators').delete().eq('id', invite.id);
        if (error) throw error;
        
        dataDispatch({ type: 'REVOKE_COLLABORATOR_SUCCESS', payload: invite.id });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Invitation refusée.', type: 'info' } });
    } catch (error) {
        console.error("Error declining invite:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const dismissNotification = async ({ dataDispatch, uiDispatch }, notificationId, user) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('notifications')
            .eq('id', user.id)
            .single();
        if (error) throw error;

        const updatedNotifications = (profile.notifications || []).filter(n => n.id !== notificationId);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ notifications: updatedNotifications })
            .eq('id', user.id);
        if (updateError) throw updateError;

        dataDispatch({ type: 'UPDATE_PROFILE_NOTIFICATIONS', payload: updatedNotifications });
    } catch (error) {
        console.error("Error dismissing notification:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

const SCENARIO_COLORS = ['#8b5cf6', '#f97316', '#d946ef'];

export const saveScenario = async ({ dataDispatch, uiDispatch }, { scenarioData, editingScenario, activeProjectId, user, existingScenariosCount }) => {
    try {
        if (activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_')) {
            throw new Error("Les scénarios ne peuvent être créés que sur des projets individuels.");
        }
        
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
            dataDispatch({ type: 'UPDATE_SCENARIO_SUCCESS', payload: {
                id: savedScenario.id,
                projectId: savedScenario.project_id,
                name: savedScenario.name,
                description: savedScenario.description,
                color: savedScenario.color,
                isVisible: savedScenario.is_visible,
                isArchived: savedScenario.is_archived
            }});
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario mis à jour.', type: 'success' } });
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
            dataDispatch({ type: 'ADD_SCENARIO_SUCCESS', payload: {
                id: savedScenario.id,
                projectId: savedScenario.project_id,
                name: savedScenario.name,
                description: savedScenario.description,
                color: savedScenario.color,
                isVisible: savedScenario.is_visible,
                isArchived: savedScenario.is_archived
            }});
            uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario créé.', type: 'success' } });
        }
    } catch (error) {
        console.error("Error saving scenario:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la sauvegarde du scénario: ${error.message}`, type: 'error' } });
    }
};

export const archiveScenario = async ({ dataDispatch, uiDispatch }, scenarioId) => {
    try {
        const { error } = await supabase
            .from('scenarios')
            .update({ is_archived: true })
            .eq('id', scenarioId);
        
        if (error) throw error;

        dataDispatch({ type: 'ARCHIVE_SCENARIO_SUCCESS', payload: scenarioId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Scénario archivé.', type: 'success' } });

    } catch (error) {
        console.error("Error archiving scenario:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const deleteScenarioEntry = async ({ dataDispatch, uiDispatch }, { scenarioId, entryId }) => {
    try {
        const { error } = await supabase
            .from('scenario_entries')
            .delete()
            .eq('scenario_id', scenarioId)
            .eq('id', entryId);

        if (error) throw error;

        dataDispatch({
            type: 'DELETE_SCENARIO_ENTRY_SUCCESS',
            payload: { scenarioId, entryId },
        });

        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modification du scénario supprimée.', type: 'success' } });

    } catch (error) {
        console.error("Error deleting scenario entry:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const addComment = async ({ dataDispatch, uiDispatch }, { projectId, rowId, columnId, content, authorId }) => {
    try {
        const mentions = content.match(/@\[([^\]]+)\]\(([^)]+)\)/g) || [];
        const mentionedUserIds = mentions.map(mention => {
            const match = /@\[([^\]]+)\]\(([^)]+)\)/.exec(mention);
            return match ? match[2] : null;
        }).filter(Boolean);

        const newCommentData = {
            project_id: projectId === 'consolidated' || projectId.startsWith('consolidated_view_') ? null : projectId,
            user_id: authorId,
            row_id: rowId,
            column_id: columnId,
            content: content,
            mentioned_users: mentionedUserIds,
        };

        const { data: savedComment, error } = await supabase
            .from('comments')
            .insert(newCommentData)
            .select()
            .single();

        if (error) throw error;

        const newCommentForState = {
            id: savedComment.id,
            projectId: savedComment.project_id,
            userId: savedComment.user_id,
            rowId: savedComment.row_id,
            columnId: savedComment.column_id,
            content: savedComment.content,
            createdAt: savedComment.created_at,
            mentionedUsers: savedComment.mentioned_users,
        };

        dataDispatch({ type: 'ADD_COMMENT_SUCCESS', payload: { newComment: newCommentForState } });

    } catch (error) {
        console.error("Error adding comment:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de l'ajout du commentaire: ${error.message}`, type: 'error' } });
    }
};

export const saveTemplate = async ({ dataDispatch, uiDispatch }, { templateData, editingTemplate, projectStructure, user }) => {
  try {
    const dataToSave = {
      user_id: user.id,
      name: templateData.name,
      description: templateData.description,
      structure: projectStructure,
      is_public: templateData.is_public || false,
      tags: templateData.tags || [],
      icon: templateData.icon,
      color: templateData.color,
      purpose: templateData.purpose,
    };

    let savedTemplate;
    if (editingTemplate) {
      const { data, error } = await supabase
        .from('templates')
        .update(dataToSave)
        .eq('id', editingTemplate.id)
        .select()
        .single();
      if (error) throw error;
      savedTemplate = data;
      dataDispatch({ type: 'UPDATE_TEMPLATE_SUCCESS', payload: {
          id: savedTemplate.id,
          userId: savedTemplate.user_id,
          name: savedTemplate.name,
          description: savedTemplate.description,
          structure: savedTemplate.structure,
          isPublic: savedTemplate.is_public,
          tags: savedTemplate.tags,
          icon: savedTemplate.icon,
          color: savedTemplate.color,
          purpose: savedTemplate.purpose,
      }});
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modèle mis à jour.', type: 'success' } });
    } else {
      const { data, error } = await supabase
        .from('templates')
        .insert(dataToSave)
        .select()
        .single();
      if (error) throw error;
      savedTemplate = data;
      dataDispatch({ type: 'SAVE_TEMPLATE_SUCCESS', payload: {
          id: savedTemplate.id,
          userId: savedTemplate.user_id,
          name: savedTemplate.name,
          description: savedTemplate.description,
          structure: savedTemplate.structure,
          isPublic: savedTemplate.is_public,
          tags: savedTemplate.tags,
          icon: savedTemplate.icon,
          color: savedTemplate.color,
          purpose: savedTemplate.purpose,
      }});
      uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modèle créé.', type: 'success' } });
    }
    uiDispatch({ type: 'CLOSE_SAVE_TEMPLATE_MODAL' });
  } catch (error) {
    console.error("Error saving template:", error);
    uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
  }
};

export const deleteTemplate = async ({ dataDispatch, uiDispatch }, templateId) => {
    try {
        const { error } = await supabase.from('templates').delete().eq('id', templateId);
        if (error) throw error;
        dataDispatch({ type: 'DELETE_TEMPLATE_SUCCESS', payload: templateId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Modèle supprimé.', type: 'success' } });
    } catch (error) {
        console.error("Error deleting template:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const saveMainCategory = async ({ dataDispatch, uiDispatch }, { type, name, user }) => {
    try {
        const { data, error } = await supabase
            .from('user_categories')
            .insert({
                user_id: user.id,
                type: type,
                name: name,
                is_fixed: false,
            })
            .select()
            .single();
        if (error) throw error;
        
        const newMainCategory = {
            id: data.id,
            name: data.name,
            isFixed: data.is_fixed,
            subCategories: []
        };

        dataDispatch({ type: 'ADD_MAIN_CATEGORY_SUCCESS', payload: { type, newMainCategory } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Catégorie principale ajoutée.', type: 'success' } });
        return newMainCategory;
    } catch (error) {
        console.error("Error saving main category:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        return null;
    }
};

export const saveSubCategory = async ({ dataDispatch, uiDispatch }, { type, mainCategoryId, subCategoryName, user }) => {
    try {
        const { data, error } = await supabase
            .from('user_categories')
            .insert({
                user_id: user.id,
                parent_id: mainCategoryId,
                name: subCategoryName,
                type: type,
                is_fixed: false,
                criticality: 'essential',
            })
            .select()
            .single();
        if (error) throw error;
        
        const newSubCategory = {
            id: data.id,
            name: data.name,
            criticality: data.criticality,
        };

        dataDispatch({ type: 'ADD_SUB_CATEGORY_SUCCESS', payload: { type, mainCategoryId, newSubCategory } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Sous-catégorie ajoutée.', type: 'success' } });
        return newSubCategory;
    } catch (error) {
        console.error("Error saving sub category:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
        return null;
    }
};

export const updateMainCategory = async ({ dataDispatch, uiDispatch }, { type, mainCategoryId, newName }) => {
    try {
        const { data, error } = await supabase
            .from('user_categories')
            .update({ name: newName })
            .eq('id', mainCategoryId)
            .select()
            .single();
        if (error) throw error;
        
        dataDispatch({ type: 'UPDATE_MAIN_CATEGORY_SUCCESS', payload: { type, mainCategoryId, newName: data.name } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Catégorie principale mise à jour.', type: 'success' } });

    } catch (error) {
        console.error("Error updating main category:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const deleteMainCategory = async ({ dataDispatch, uiDispatch }, { type, mainCategoryId }) => {
    try {
        const { error } = await supabase
            .from('user_categories')
            .delete()
            .eq('id', mainCategoryId);
        if (error) throw error;

        dataDispatch({ type: 'DELETE_MAIN_CATEGORY_SUCCESS', payload: { type, mainCategoryId } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Catégorie principale supprimée.', type: 'success' } });

    } catch (error) {
        console.error("Error deleting main category:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const deleteProject = async ({ dataDispatch, uiDispatch }, projectId) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;

        dataDispatch({ type: 'DELETE_PROJECT_SUCCESS', payload: projectId });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Projet supprimé.', type: 'success' } });

    } catch (error) {
        console.error("Error deleting project:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur lors de la suppression du projet: ${error.message}`, type: 'error' } });
    }
};

export const updateTierPaymentTerms = async ({ dataDispatch, uiDispatch }, { tierId, terms }) => {
    try {
        const { data, error } = await supabase
            .from('tiers')
            .update({ payment_terms: terms })
            .eq('id', tierId)
            .select()
            .single();
        if (error) throw error;
        
        dataDispatch({
            type: 'UPDATE_TIER_PAYMENT_TERMS_SUCCESS',
            payload: {
                tierId: data.id,
                payment_terms: data.payment_terms
            }
        });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Conditions de paiement mises à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating payment terms:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};

export const updateSubCategoryCriticality = async ({ dataDispatch, uiDispatch }, { subCategoryId, newCriticality }) => {
    try {
        const { data, error } = await supabase
            .from('user_categories')
            .update({ criticality: newCriticality })
            .eq('id', subCategoryId)
            .select()
            .single();
        if (error) throw error;
        
        dataDispatch({ type: 'UPDATE_SUB_CATEGORY_CRITICALITY_SUCCESS', payload: { subCategoryId, criticality: data.criticality } });
        uiDispatch({ type: 'ADD_TOAST', payload: { message: 'Niveau de criticité mis à jour.', type: 'success' } });
    } catch (error) {
        console.error("Error updating sub-category criticality:", error);
        uiDispatch({ type: 'ADD_TOAST', payload: { message: `Erreur: ${error.message}`, type: 'error' } });
    }
};
