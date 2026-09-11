'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search,
  BookOpen,
  PlayCircle,
  ChevronRight,
  Plus,
  FileText,
  Video,
  Code,
  Network,
  ShieldCheck,
  Layers,
  Download,
  Trash2,
  X,
  Upload,
  Loader2,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { adminService } from '@/services/admin.service';
import { format } from 'date-fns';
import { NativeSelect } from '@/components/ui/native-select';
import toast from 'react-hot-toast';

interface KnowledgeStats {
  totalArticles: number;
  trainingVideos: number;
  categories: { name: string; count: number }[];
  activities: {
    id: string;
    resourceName: string;
    description?: string;
    category: string;
    type: string;
    organization: string;
    organizationId?: string;
    fileUrl: string;
    fileSize: number;
    uploadedBy: string;
    lastModified: string;
  }[];
}

const CATEGORY_PILLS = [
  'All Resources',
  'Architecture',
  'Compliance & Security',
  'Integration APIs',
  'User Training',
  'Organization Flow',
  'Security Docs',
];

export default function KnowledgePage() {
  const [data, setData] = useState<KnowledgeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Resources');
  const [isAddResourceModalOpen, setIsAddResourceModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  // New Resource Form State
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceCategory, setResourceCategory] = useState('Architecture');
  const [resourceType, setResourceType] = useState('DOCUMENT');
  const [externalUrl, setExternalUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await adminService.getKnowledgeStats();
      setData(response);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load knowledge base data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle.trim()) {
      toast.error('Please provide a resource title');
      return;
    }
    if (!selectedFile && !externalUrl.trim()) {
      toast.error('Please upload a file or provide a valid external URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', resourceTitle.trim());
      formData.append('description', resourceDescription.trim());
      formData.append('category', resourceCategory);
      formData.append('resourceType', resourceType);
      if (externalUrl.trim()) {
        formData.append('externalUrl', externalUrl.trim());
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/admin/knowledge/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Resource published to knowledge repository');
      setIsAddResourceModalOpen(false);
      // Reset form
      setResourceTitle('');
      setResourceDescription('');
      setResourceCategory('Architecture');
      setResourceType('DOCUMENT');
      setExternalUrl('');
      setSelectedFile(null);
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to create resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the repository?`)) return;
    try {
      setDeletingId(id);
      await api.delete(`/admin/knowledge/resources/${id}`);
      toast.success('Resource removed successfully');
      fetchStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to delete resource');
    } finally {
      setDeletingId(null);
    }
  };

  const { totalArticles, trainingVideos, categories, activities } = data || {
    totalArticles: 0,
    trainingVideos: 0,
    categories: [],
    activities: []
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('architecture')) return <Network className="w-4 h-4 text-blue-600" />;
    if (lower.includes('security') || lower.includes('compliance')) return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('api') || lower.includes('integration')) return <Code className="w-4 h-4 text-purple-600" />;
    if (lower.includes('training') || lower.includes('video')) return <PlayCircle className="w-4 h-4 text-amber-600" />;
    return <Layers className="w-4 h-4 text-neutral-600" />;
  };

  const getTypeStyle = (type: string) => {
    if (type === 'DOCUMENT' || type === 'PDF') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (type === 'MEDIA' || type === 'VIDEO') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (type === 'CODE' || type === 'JSON') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'DOCUMENT' || type === 'PDF') return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
    if (type === 'MEDIA' || type === 'VIDEO') return <Video className="w-4 h-4 text-amber-600 shrink-0" />;
    if (type === 'CODE' || type === 'JSON') return <Code className="w-4 h-4 text-emerald-600 shrink-0" />;
    return <FileText className="w-4 h-4 text-neutral-500 shrink-0" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Category filter
      let matchesCategory = true;
      if (activeCategory !== 'All Resources') {
        const cat = (act.category || '').toLowerCase();
        const active = activeCategory.toLowerCase();
        matchesCategory = cat.includes(active) || active.includes(cat);
      }

      // Search query
      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch = 
          act.resourceName.toLowerCase().includes(q) ||
          (act.description && act.description.toLowerCase().includes(q)) ||
          act.category.toLowerCase().includes(q) ||
          act.organization.toLowerCase().includes(q);
      }

      return matchesCategory && matchesSearch;
    });
  }, [activities, activeCategory, searchQuery]);

  return (
    <div className="max-w-[1600px] mx-auto text-slate-900 font-sans flex flex-col gap-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 font-medium mt-1">
            Centralized repository for system documentation, training materials, and support articles. Manage global resources shared across organizations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white border border-neutral-200/90 hover:bg-neutral-50 text-neutral-700 transition-all shadow-2xs"
            title="Refresh Knowledge Base"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddResourceModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#e05934] hover:bg-[#c94a2a] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center bg-white border border-neutral-200/90 rounded-2xl px-4 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-[#e05934] transition-all">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation, articles, or training modules..." 
            className="w-full bg-transparent border-none outline-none py-2 text-xs md:text-sm text-neutral-900 placeholder:text-neutral-400 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 mr-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={() => {}}
            className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            Search
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activeCategory === pill;
            return (
              <button 
                key={pill} 
                onClick={() => setActiveCategory(pill)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isActive 
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' 
                    : 'bg-white text-neutral-600 border-neutral-200/90 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Grid: Real Live Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Live Database
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Articles & Docs</span>
          <div className="text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
            {isLoading ? <div className="skeleton h-9 w-24 rounded-lg" /> : totalArticles}
          </div>
          <span className="text-xs text-neutral-500 font-medium mt-1">
            {categories.length} Knowledge Categories Indexed
          </span>
        </div>

        <div className="p-6 rounded-2xl border border-neutral-200/90 bg-white shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Interactive Media
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Training Videos & Tutorials</span>
          <div className="text-3xl font-extrabold text-neutral-900 tracking-tight mt-1">
            {isLoading ? <div className="skeleton h-9 w-24 rounded-lg" /> : trainingVideos}
          </div>
          <span className="text-xs text-neutral-500 font-medium mt-1">
            Multimedia Video Assets & Guides
          </span>
        </div>
      </div>

      {/* Main Grid: Equal Stretched Height with Static Bottom Anchored Footer */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] items-stretch gap-6">
        {/* Browse Categories Sidebar */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs p-6 flex flex-col justify-between h-full min-h-[460px]">
          <div>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Browse Categories</h3>
              <FolderOpen className="w-4 h-4 text-neutral-400" />
            </div>

            <div className="flex flex-col gap-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-xs text-neutral-400 py-6 text-center">No categories yet</div>
              ) : (
                categories.map((cat, idx) => {
                  const isSelected = activeCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setActiveCategory(cat.name)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs' 
                          : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/60 text-neutral-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-700 shadow-2xs'}`}>
                          {getCategoryIcon(cat.name)}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{cat.name}</div>
                          <div className={`text-[11px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                            {cat.count} {cat.count === 1 ? 'Resource' : 'Resources'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-auto border-t border-neutral-100">
            <button 
              onClick={() => setIsCategoriesModalOpen(true)}
              className="w-full py-2.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-bold text-neutral-800 transition-all shadow-2xs text-center"
            >
              View All Categories
            </button>
          </div>
        </div>

        {/* Recent Repository Activity: Table with Static Anchored Footer */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden flex flex-col justify-between h-full min-h-[460px]">
          {/* Card Header */}
          <div className="p-5 flex justify-between items-center border-b border-neutral-100 bg-neutral-50/50">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Recent Repository Activity</h3>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                Live database resources, handouts, whitepapers, and guides
              </p>
            </div>
            <button 
              onClick={() => setIsAddResourceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> 
              <span>Add Resource</span>
            </button>
          </div>

          {/* Table Container (flex-1 so table fills space and footer stays static at the bottom) */}
          <div className="flex-1 overflow-x-auto flex flex-col">
            {isLoading ? (
              <div className="p-6 space-y-3 flex-1">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <FileText className="w-10 h-10 text-neutral-300 mb-2" />
                <h4 className="text-sm font-bold text-neutral-800">No Resources Found</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  {searchQuery 
                    ? `No resources matching "${searchQuery}" in ${activeCategory}.` 
                    : `No items in ${activeCategory}. Click "+ Add Resource" to upload materials.`}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3.5 px-6">Resource Name</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Organization</th>
                    <th className="py-3.5 px-4">Last Modified</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredActivities.map((act) => {
                    const typeStyle = getTypeStyle(act.type);
                    return (
                      <tr key={act.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getTypeIcon(act.type)}</div>
                            <div>
                              <div className="font-bold text-neutral-900 text-xs">
                                {act.resourceName}
                              </div>
                              <div className="text-neutral-500 text-[11px] font-medium flex items-center gap-2 mt-0.5">
                                <span>{act.category}</span>
                                {act.fileSize > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{formatFileSize(act.fileSize)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeStyle}`}>
                            {act.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 font-medium">
                          {act.organization}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-500 font-medium">
                          {act.lastModified ? format(new Date(act.lastModified), 'dd MMM yyyy') : 'Recently'}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {act.fileUrl && (
                              <a
                                href={act.fileUrl.startsWith('http') ? act.fileUrl : act.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-all"
                                title="Open or Download Resource"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteResource(act.id, act.resourceName)}
                              disabled={deletingId === act.id}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-all disabled:opacity-50"
                              title="Delete Resource"
                            >
                              {deletingId === act.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Static Anchored Bottom Footer */}
          <div className="p-4 text-center border-t border-neutral-100 bg-neutral-50/60 mt-auto">
            <button 
              onClick={() => router.push('/super-admin/system-health')}
              className="text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              See full activity log
            </button>
          </div>
        </div>
      </div>

      {/* View All Categories Modal */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-md w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">All Knowledge Categories</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Browse all categories in the central repository</p>
              </div>
              <button 
                onClick={() => setIsCategoriesModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setIsCategoriesModalOpen(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                      {getCategoryIcon(cat.name)}
                    </div>
                    <span className="text-xs font-bold text-neutral-900">{cat.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                onClick={() => setIsCategoriesModalOpen(false)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {isAddResourceModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-lg w-full p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">Add New Knowledge Resource</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Upload a document to blob storage or link external materials</p>
              </div>
              <button 
                onClick={() => setIsAddResourceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="e.g. Q3 Security & Audit Guidelines" 
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <NativeSelect
                    value={resourceCategory}
                    onChange={(e) => setResourceCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                  >
                    <option value="Architecture">Architecture</option>
                    <option value="Compliance & Security">Compliance & Security</option>
                    <option value="Integration APIs">Integration APIs</option>
                    <option value="User Training">User Training</option>
                    <option value="Organization Flow">Organization Flow</option>
                    <option value="Security Docs">Security Docs</option>
                    <option value="System Admin">System Admin</option>
                  </NativeSelect>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Resource Type
                  </label>
                  <NativeSelect
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                  >
                    <option value="DOCUMENT">Document (PDF / Text)</option>
                    <option value="MEDIA">Media / Video</option>
                    <option value="CODE">Code / JSON / API</option>
                    <option value="GUIDELINE">Policy / Guideline</option>
                  </NativeSelect>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Description / Overview
                </label>
                <textarea
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  placeholder="Summary of document purpose and guidelines..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Upload File (Stored in Blob Storage)
                </label>
                <div className="border border-dashed border-neutral-300 rounded-xl p-4 bg-neutral-50/50 hover:bg-neutral-50 text-center flex flex-col items-center justify-center cursor-pointer relative">
                  <input 
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 text-neutral-400 mb-1.5" />
                  <span className="text-xs font-bold text-neutral-700">
                    {selectedFile ? selectedFile.name : 'Click or drop file to upload'}
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    {selectedFile ? `${formatFileSize(selectedFile.size)} • Ready to store` : 'PDF, DOCX, MP4, JSON, TXT up to 50MB'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Or External Link URL
                </label>
                <input 
                  type="url" 
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://docs.example.com/spec or https://youtube.com/..." 
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e05934] transition-all"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                <button 
                  type="button"
                  onClick={() => setIsAddResourceModalOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200/90 rounded-xl text-xs font-bold text-neutral-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#e05934] hover:bg-[#c94a2a] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Resource</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
