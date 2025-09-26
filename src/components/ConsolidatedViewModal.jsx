import React, { useState, useEffect } from 'react';
import { X, Save, Layers } from 'lucide-react';
import { useData } from '../context/DataContext';

const ConsolidatedViewModal = ({ isOpen, onClose, onSave, editingView }) => {
  const { dataState } = useData();
  const { projects } = dataState;
  const activeProjects = projects.filter(p => !p.isArchived);

  const [name, setName] = useState('');
  const [selectedProjects, setSelectedProjects] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      if (editingView) {
        setName(editingView.name);
        setSelectedProjects(new Set(editingView.project_ids));
      } else {
        setName('');
        setSelectedProjects(new Set());
      }
    }
  }, [isOpen, editingView]);

  const handleProjectToggle = (projectId) => {
    const newSelection = new Set(selectedProjects);
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId);
    } else {
      newSelection.add(projectId);
    }
    setSelectedProjects(newSelection);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Veuillez donner un nom à la vue consolidée.");
      return;
    }
    if (selectedProjects.size < 2) {
      alert("Veuillez sélectionner au moins deux projets à consolider.");
      return;
    }
    onSave({ name, project_ids: Array.from(selectedProjects) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            {editingView ? 'Modifier la vue consolidée' : 'Nouvelle Vue Consolidée'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la vue *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Ex: Tous mes projets pros, Patrimoine Global..."
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Projets à inclure *</label>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-2 bg-gray-50 space-y-2">
              {activeProjects.map(project => (
                <div key={project.id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                  <input
                    type="checkbox"
                    id={`project-${project.id}`}
                    checked={selectedProjects.has(project.id)}
                    onChange={() => handleProjectToggle(project.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor={`project-${project.id}`} className="ml-3 text-sm font-medium text-gray-700">
                    {project.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
              Annuler
            </button>
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
              <Save className="w-4 h-4" /> Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsolidatedViewModal;
