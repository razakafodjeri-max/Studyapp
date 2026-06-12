import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Task } from '../../main/db';
import { estimateTaskPomodoros } from '../../utils/aiEstimator';
import { 
  Plus, 
  Search, 
  Trash2, 
  Sparkles, 
  Calendar, 
  AlertTriangle,
  Folder,
  Check,
  Edit2
} from 'lucide-react';

const Tasks: React.FC = () => {
  const { tasks, saveTask, deleteTask } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('Général');
  const [dueDate, setDueDate] = useState('');
  const [estimatedPomos, setEstimatedPomos] = useState(2);

  // AI loading indicator
  const [estimating, setEstimating] = useState(false);

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required for onDrop to trigger
  };

  const handleDrop = async (e: React.DragEvent, completed: boolean) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === id);
    if (task && task.completed !== completed) {
      await saveTask({
        ...task,
        completed
      });
    }
  };

  // Trigger Local AI estimation
  const runAIEstimation = () => {
    if (!title) return;
    setEstimating(true);
    
    // Simulate brief processing for professional feeling
    setTimeout(() => {
      const estimate = estimateTaskPomodoros(title, description);
      setEstimatedPomos(estimate.pomodoros);
      setPriority(
        estimate.difficulty === 'Difficile' 
          ? 'high' 
          : estimate.difficulty === 'Moyen' 
            ? 'medium' 
            : 'low'
      );
      setEstimating(false);
    }, 400);
  };

  // Open modal for new task
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('Travail');
    setDueDate(new Date().toISOString().split('T')[0]);
    setEstimatedPomos(2);
    setIsModalOpen(true);
  };

  // Open modal for editing task
  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setCategory(task.category);
    setDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setEstimatedPomos(task.estimatedPomodoros);
    setIsModalOpen(true);
  };

  // Save Task Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData: Task = {
      id: editingTask ? editingTask.id : 'task_' + Date.now(),
      title,
      description,
      priority,
      category,
      dueDate,
      estimatedPomodoros: estimatedPomos,
      actualPomodoros: editingTask ? editingTask.actualPomodoros : 0,
      completed: editingTask ? editingTask.completed : false,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString()
    };

    await saveTask(taskData);
    setIsModalOpen(false);
  };

  // Delete task
  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette tâche ?')) {
      await deleteTask(id);
    }
  };

  // Filter tasks based on Search, Priority, Category
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
    return matchesSearch && matchesPriority && matchesCategory;
  });

  const todoTasks = filteredTasks.filter(t => !t.completed);
  const doneTasks = filteredTasks.filter(t => t.completed);

  // Categories list for filtering
  const categoriesList = ['all', ...Array.from(new Set(tasks.map(t => t.category)))];

  // Helper styles for priority tags
  const getPriorityStyle = (p: 'low' | 'medium' | 'high') => {
    if (p === 'high') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (p === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* 🔍 Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-9 py-2 text-xs"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="glass-input py-2 px-3 text-xs focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="all">Priorité (Toutes)</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Basse</option>
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="glass-input py-2 px-3 text-xs focus:ring-0 focus:outline-none cursor-pointer"
          >
            <option value="all">Catégorie (Toutes)</option>
            {categoriesList.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Add Task Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-blue to-brand-purple hover:opacity-90 transition-all shadow-lg shadow-brand-purple/10 cursor-pointer self-start md:self-auto"
        >
          <Plus size={14} />
          <span>Ajouter une Tâche</span>
        </button>
      </div>

      {/* 🚀 Drag & Drop Board columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch overflow-hidden">
        
        {/* COLUMN 1: À FAIRE */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, false)}
          className="glass-panel rounded-2xl p-5 flex flex-col space-y-4 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">À FAIRE ({todoTasks.length})</h3>
            <span className="text-[10px] text-slate-500 font-mono">Glisser-déposer ici</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {todoTasks.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-black/5 dark:border-white/5 rounded-xl">
                <span>Aucune tâche à faire.</span>
              </div>
            ) : (
              todoTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="glass-card p-4 flex flex-col justify-between hover:shadow-md cursor-grab active:cursor-grabbing hover:border-black/10 dark:hover:border-white/10 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white leading-snug">{task.title}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-medium ${getPriorityStyle(task.priority)}`}>
                        {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>
                      <span className="flex items-center gap-1 bg-black/5 dark:bg-slate-950/20 px-1.5 py-0.5 rounded">
                        <Folder size={10} />
                        {task.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-purple dark:text-brand-purple-glow">Est. {task.estimatedPomodoros} Pomos</span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar size={10} />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: TERMINÉES */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, true)}
          className="glass-panel rounded-2xl p-5 flex flex-col space-y-4 overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">TERMINÉES ({doneTasks.length})</h3>
            <span className="text-[10px] text-slate-500 font-mono">Glisser-déposer ici</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {doneTasks.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-black/5 dark:border-white/5 rounded-xl">
                <span>Déposez vos tâches ici pour les terminer !</span>
              </div>
            ) : (
              doneTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="glass-card p-4 flex flex-col justify-between hover:shadow-md cursor-grab active:cursor-grabbing border-emerald-500/10 hover:border-emerald-500/20 group opacity-70"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 line-through leading-snug">{task.title}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDelete(task.id)}
                          className="p-1 text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check size={12} />
                      Terminée
                    </span>
                    <span className="text-[9px] font-mono">Pomos réels: {task.actualPomodoros || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 🛠️ TASK MODAL (ADD / EDIT) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md glass-card p-6 md:p-8 space-y-5 border border-white/10 shadow-2xl relative">
            <h3 className="text-base font-bold font-sans text-slate-800 dark:text-white">
              {editingTask ? 'Modifier la Tâche' : 'Créer une Nouvelle Tâche'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Titre de la tâche</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Rédiger le rapport de StudyFlow"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full text-xs"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea 
                  placeholder="ex: Détaillez les étapes de conception, base de données et IA..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="glass-input w-full text-xs resize-none"
                />
              </div>

              {/* Category, Priority and Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Catégorie</label>
                  <input 
                    type="text" 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date limite</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="glass-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priorité</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="glass-input w-full text-xs cursor-pointer focus:ring-0"
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>

                {/* Estimate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pomos Estimés</label>
                  <input 
                    type="number" 
                    min="1"
                    max="12"
                    value={estimatedPomos}
                    onChange={(e) => setEstimatedPomos(parseInt(e.target.value, 10))}
                    className="glass-input w-full text-xs"
                  />
                </div>
              </div>

              {/* AI Estimator widget */}
              <div className="p-3 bg-brand-purple/5 border border-brand-purple/10 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-brand-purple dark:text-brand-purple-glow flex items-center gap-1">
                    <Sparkles size={11} />
                    Estimation intelligente IA
                  </span>
                  <p className="text-[9px] text-slate-500">Remplit la priorité et la durée estimée selon le titre.</p>
                </div>
                <button
                  type="button"
                  onClick={runAIEstimation}
                  disabled={estimating || !title}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-colors cursor-pointer ${
                    estimating || !title 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                      : 'bg-brand-purple hover:bg-brand-purple-hover'
                  }`}
                >
                  {estimating ? 'Analyse...' : 'Estimer'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-black/5 dark:border-white/5 bg-black/5 dark:bg-slate-900/40 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-brand-blue to-brand-purple text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-95 transition-all"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
