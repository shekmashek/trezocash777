import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Send, AtSign } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { addComment } from '../context/actions';
import Avatar from './Avatar';
import { motion, AnimatePresence } from 'framer-motion';

const CommentDrawer = ({ isOpen, onClose, context }) => {
    const { dataState, dataDispatch } = useData();
    const { uiDispatch } = useUI();
    const { allComments, allProfiles, session, collaborators } = dataState;
    const { activeProjectId } = useUI();
    const [newComment, setNewComment] = useState('');
    const [mentionQuery, setMentionQuery] = useState('');
    const [isMentioning, setIsMentioning] = useState(false);
    const textareaRef = useRef(null);

    const relevantComments = useMemo(() => {
        if (!isOpen || !context) return [];
        const commentsForProject = allComments[activeProjectId] || [];
        return commentsForProject
            .filter(c => c.rowId === context.rowId && c.columnId === context.columnId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [isOpen, context, allComments, activeProjectId]);

    const availableUsersForMention = useMemo(() => {
        const users = new Map();
        allProfiles.forEach(p => {
            if (p.id && p.full_name) {
                users.set(p.id, p);
            }
        });
        collaborators.forEach(c => {
            if (c.user_id && !users.has(c.user_id)) {
                const profile = allProfiles.find(p => p.id === c.user_id);
                if (profile && profile.full_name) {
                    users.set(profile.id, profile);
                }
            }
        });
        const userArray = Array.from(users.values());
        if (!mentionQuery) return userArray;
        return userArray.filter(u => u.full_name.toLowerCase().includes(mentionQuery.toLowerCase()));
    }, [allProfiles, collaborators, mentionQuery]);

    useEffect(() => {
        if (!isOpen) {
            setNewComment('');
            setIsMentioning(false);
            setMentionQuery('');
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const text = e.target.value;
        const cursorPos = e.target.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        
        if (atIndex !== -1 && !textBeforeCursor.substring(atIndex + 1).includes(' ')) {
            setIsMentioning(true);
            setMentionQuery(textBeforeCursor.substring(atIndex + 1));
        } else {
            setIsMentioning(false);
            setMentionQuery('');
        }
        setNewComment(text);
    };

    const handleSelectMention = (user) => {
        const text = newComment;
        const cursorPos = textareaRef.current.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        
        const textBeforeMention = text.substring(0, atIndex);
        const textAfterCursor = text.substring(cursorPos);
        
        const mentionText = `@[${user.full_name}](${user.id}) `;
        
        setNewComment(textBeforeMention + mentionText + textAfterCursor);
        setIsMentioning(false);
        setMentionQuery('');
        textareaRef.current.focus();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        addComment({dataDispatch, uiDispatch}, {
            projectId: activeProjectId,
            rowId: context.rowId,
            columnId: context.columnId,
            content: newComment,
            authorId: session.user.id,
        });
        setNewComment('');
    };

    const formatCommentContent = (content) => {
        const parts = content.split(/(\@\[[^\]]+\]\([^)]+\))/g);
        return parts.map((part, index) => {
            const match = /@\[([^\]]+)\]\(([^)]+)\)/.exec(part);
            if (match) {
                return <span key={index} className="bg-blue-100 text-blue-700 font-semibold rounded px-1 py-0.5">@{match[1]}</span>;
            }
            return part;
        });
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black z-40 transition-opacity bg-opacity-60" onClick={onClose}></div>
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between p-4 border-b">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Commentaires</h2>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{context?.rowName} - {context?.columnName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
                        {relevantComments.map(comment => {
                            const author = allProfiles.find(p => p.id === comment.userId);
                            return (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar name={author?.full_name} role={null} />
                                    <div className="flex-grow bg-white p-3 rounded-lg border">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-sm text-gray-800">{author?.full_name || 'Utilisateur inconnu'}</span>
                                            <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString('fr-FR')}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{formatCommentContent(comment.content)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {relevantComments.length === 0 && <p className="text-center text-sm text-gray-500 py-8">Aucun commentaire. Soyez le premier !</p>}
                    </div>
                    <div className="p-4 border-t bg-white relative">
                        <AnimatePresence>
                            {isMentioning && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute bottom-full left-4 right-4 mb-2 max-h-48 overflow-y-auto bg-white border rounded-lg shadow-lg z-10">
                                    {availableUsersForMention.map(user => (
                                        <button key={user.id} onClick={() => handleSelectMention(user)} className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-gray-100">
                                            <Avatar name={user.full_name} role={null} />
                                            <span className="text-sm font-medium">{user.full_name}</span>
                                        </button>
                                    ))}
                                    {availableUsersForMention.length === 0 && <p className="text-sm text-gray-500 p-2 text-center">Aucun utilisateur trouvé</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <form onSubmit={handleSubmit} className="flex items-start gap-2">
                            <textarea
                                ref={textareaRef}
                                value={newComment}
                                onChange={handleInputChange}
                                placeholder="Ajouter un commentaire... Utilisez @ pour mentionner."
                                className="w-full px-3 py-2 border rounded-lg resize-none text-sm"
                                rows="3"
                            />
                            <button type="submit" className="h-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300" disabled={!newComment.trim()}>
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommentDrawer;
