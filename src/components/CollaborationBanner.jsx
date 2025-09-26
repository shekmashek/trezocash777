import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { Info, Check, X, CheckCircle, XCircle } from 'lucide-react';
import { acceptInvite, declineInvite, dismissNotification } from '../context/actions';

const CollaborationBanner = () => {
    const { dataState, dataDispatch } = useData();
    const { uiState, uiDispatch } = useUI();
    const { session, projects, collaborators, allProfiles, profile } = dataState;
    const { activeProjectId } = uiState;

    // 1. Check for pending invitations for the current user
    const pendingInvite = useMemo(() => {
        if (!session?.user?.email) return null;
        return collaborators.find(c => c.email === session.user.email && c.status === 'pending');
    }, [collaborators, session]);

    // 2. Check for owner notifications
    const ownerNotification = useMemo(() => {
        return (profile?.notifications || [])[0];
    }, [profile]);

    // 3. If no invites/notifications, check if working on a shared project
    const sharedProjectInfo = useMemo(() => {
        if (pendingInvite || ownerNotification || !activeProjectId || activeProjectId === 'consolidated' || activeProjectId.startsWith('consolidated_view_')) {
            return null;
        }

        const activeProject = projects.find(p => p.id === activeProjectId);
        if (activeProject && activeProject.user_id !== session?.user?.id) {
            const ownerProfile = allProfiles.find(p => p.id === activeProject.user_id);
            const myCollaboration = collaborators.find(c => c.user_id === session?.user?.id && c.projectIds?.includes(activeProjectId));
            
            if (ownerProfile && myCollaboration) {
                return {
                    ownerName: ownerProfile.full_name || 'un utilisateur',
                    role: myCollaboration.role === 'editor' ? 'éditeur' : 'lecture seule'
                };
            }
        }
        return null;
    }, [pendingInvite, ownerNotification, activeProjectId, projects, session, allProfiles, collaborators]);

    const handleAccept = () => {
        acceptInvite({dataDispatch, uiDispatch}, pendingInvite, session.user);
    };

    const handleDecline = () => {
        declineInvite({dataDispatch, uiDispatch}, pendingInvite, session.user);
    };
    
    const handleDismissNotification = () => {
        dismissNotification({dataDispatch, uiDispatch}, ownerNotification.id, session.user);
    };

    if (pendingInvite) {
        const ownerProfile = allProfiles.find(p => p.id === pendingInvite.ownerId);
        const ownerName = ownerProfile?.full_name || 'Quelqu\'un';
        const ownerEmail = ownerProfile?.email;
        const ownerDisplay = ownerEmail ? `${ownerName} (${ownerEmail})` : ownerName;
        
        const firstProjectId = pendingInvite.projectIds?.[0];
        const projectName = projects.find(p => p.id === firstProjectId)?.name || 'un projet';

        return (
            <div className="bg-blue-100 border-b border-blue-200 text-blue-800 px-6 py-3">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">
                            <strong>{ownerDisplay}</strong> vous invite à collaborer sur le projet : <strong>{projectName}</strong>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleAccept} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md font-medium flex items-center gap-1 text-sm">
                            <Check size={16} /> Accepter
                        </button>
                        <button onClick={handleDecline} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md font-medium flex items-center gap-1 text-sm">
                            <X size={16} /> Refuser
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (ownerNotification) {
        const { collaboratorName, collaboratorEmail, projectName, status } = ownerNotification;
        const statusText = status === 'accepted' ? 'accepté' : 'refusé';
        const bannerColor = status === 'accepted' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800';
        const Icon = status === 'accepted' ? CheckCircle : XCircle;

        return (
            <div className={`${bannerColor} border-b px-6 py-3`}>
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">
                            <strong>{collaboratorName}</strong> ({collaboratorEmail}) a <strong>{statusText}</strong> la collaboration sur le projet : <strong>{projectName}</strong>.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleDismissNotification} className="bg-white/50 hover:bg-white/80 px-3 py-1 rounded-md font-medium flex items-center gap-1 text-sm">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (sharedProjectInfo) {
        return (
            <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 px-6 py-2">
                <div className="container mx-auto flex justify-center items-center">
                    <div className="flex items-center gap-2 text-sm">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <p>
                            Vous travaillez sur le projet de <strong>{sharedProjectInfo.ownerName}</strong> en tant que <strong>{sharedProjectInfo.role}</strong>.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CollaborationBanner;
