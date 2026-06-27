import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  BookOpen, Shield, Loader2, Edit, Trash2, Save, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BookProject {
  id: string;
  title: string;
  genre: string;
  prompt: string;
  setting: string;
  target_length: number;
  user_id: string;
  created_at: string;
}

interface Chapter {
  id:  string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
}

export default function BookApprovalAdmin() {
  const [projects, setProjects] = useState<BookProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<BookProject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<BookProject | null>(null);
  const [savingProject, setSavingProject] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (chapters.length > 0 && currentChapterIndex >= 0 && currentChapterIndex < chapters.length) {
      setCurrentChapter({ ...chapters[currentChapterIndex] });
    } else {
      setCurrentChapter(null);
    }
  }, [currentChapterIndex, chapters]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('book_projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (projectId: string) => {
    const { data, error } = await supabase
      .from('book_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('chapter_number');

    if (error) {
      console.error('Error loading chapters:', error);
      return [];
    }
    return data || [];
  };

  const openEditor = async (project: BookProject) => {
    setSelectedProject(project);
    setEditingProject({ ...project });
    const chaps = await loadChapters(project.id);
    setChapters(chaps);
    setCurrentChapterIndex(0);
    setEditorOpen(true);
  };

  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const handleSaveProject = async () => {
    if (!editingProject) return;

    setSavingProject(true);
    try {
      const { error } = await (supabase as any)
        .from('book_projects')
        .update({
          title: editingProject.title,
          genre: editingProject.genre,
          prompt: editingProject.prompt,
          setting: editingProject.setting,
          target_length: editingProject.target_length,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProject.id);

      if (error) throw error;

      toast.success('✅ Project updated! ');
      setSelectedProject(editingProject);
      fetchProjects();
    } catch (error:  any) {
      console.error('Error:', error);
      toast.error('Failed to update:  ' + error.message);
    } finally {
      setSavingProject(false);
    }
  };

  const handleSaveChapter = async () => {
    if (!currentChapter) return;

    setSavingChapter(true);
    try {
      const wordCount = currentChapter.content. trim().split(/\s+/).length;

      const { error } = await (supabase as any)
        .from('book_chapters')
        .update({
          title: currentChapter.title,
          content: currentChapter.content,
          word_count: wordCount,
          updated_at:  new Date().toISOString()
        })
        .eq('id', currentChapter.id);

      if (error) throw error;

      toast.success('✅ Chapter saved!');
      if (selectedProject) {
        const chaps = await loadChapters(selectedProject.id);
        setChapters(chaps);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to save: ' + error. message);
    } finally {
      setSavingChapter(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    if (! confirm(`⚠️ DELETE "${selectedProject.title}"?\n\nThis will delete:\n- The project\n- All ${chapters.length} chapters\n- Cannot be undone! `)) {
      return;
    }

    setDeletingProject(true);
    try {
      const { error:  chaptersError } = await supabase
        .from('book_chapters')
        .delete()
        .eq('project_id', selectedProject.id);

      if (chaptersError) throw chaptersError;

      const { error: projectError } = await supabase
        .from('book_projects')
        .delete()
        .eq('id', selectedProject.id);

      if (projectError) throw projectError;

      toast.success('🗑️ Project deleted');
      setEditorOpen(false);
      fetchProjects();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to delete: ' + error.message);
    } finally {
      setDeletingProject(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!currentChapter) return;
    if (!confirm('Delete this chapter?')) return;

    try {
      const { error } = await supabase
        .from('book_chapters')
        .delete()
        .eq('id', currentChapter.id);

      if (error) throw error;

      toast.success('Chapter deleted');
      if (selectedProject) {
        const chaps = await loadChapters(selectedProject.id);
        setChapters(chaps);
        if (chaps.length > 0) {
          setCurrentChapterIndex(Math.min(currentChapterIndex, chaps.length - 1));
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to delete chapter');
    }
  };

  const handlePublish = async () => {
    if (!selectedProject || chapters.length === 0) {
      toast.error('Project must have at least one chapter');
      return;
    }

    setPublishing(true);
    try {
      const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
      const excerpt = chapters[0]?.content. substring(0, 500) || "";

      const { data:  existing } = await supabase
        .from('occult_library_books')
        .select('id')
        .eq('book_project_id', selectedProject.id)
        .single();

      if (existing) {
        toast.error('This project is already published! ');
        setPublishing(false);
        return;
      }

      const { error } = await (supabase as any)
        .from('occult_library_books')
        .insert({
          book_project_id:  selectedProject.id,
          title: selectedProject.title,
          author: 'Infernal Chronicles',
          description: selectedProject.prompt,
          price_cents: 2999,
          category: selectedProject.genre,
          total_chapters: chapters.length,
          total_words: totalWords,
          excerpt: excerpt,
          featured:  false
        });

      if (error) throw error;

      toast.success('✅ Book published to Occult Library!');
      fetchProjects();
      setEditorOpen(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to publish: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-red-600 flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Book Editor & Publisher
          </h1>
          <p className="text-gray-400 mt-1">Enterprise-grade book editing platform</p>
        </div>
      </div>

      <Card className="bg-blue-950/20 border-blue-600/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-gray-400">Total Book Projects</div>
            </div>
            <BookOpen className="h-12 w-12 text-blue-600/50" />
          </div>
        </CardContent>
      </Card>

      {loading ?  (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="bg-gray-900 border-red-600/30 hover:border-red-600/60 transition-all cursor-pointer"
              onClick={() => openEditor(project)}
            >
              <CardContent className="p-6 space-y-3">
                <div>
                  <h3 className="font-bold text-xl text-white mb-1">{project.title}</h3>
                  <p className="text-sm text-gray-400 capitalize">{project.genre}</p>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{project.prompt}</p>
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Book
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ENTERPRISE BOOK EDITOR DIALOG */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] bg-[#0a0a0a] border-red-600/50 p-0 z-[9999]">
          <div className="flex flex-col h-full">
            {/* HEADER */}
            <DialogHeader className="p-4 bg-gray-900 border-b border-red-600/30 flex-shrink-0">
              <DialogTitle className="text-2xl text-red-600 flex items-center justify-between">
                <span>📚 {selectedProject?.title}</span>
                <Button
                  onClick={handleDeleteProject}
                  disabled={deletingProject}
                  variant="destructive"
                  size="sm"
                >
                  {deletingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </DialogTitle>
            </DialogHeader>

            {/* TABS */}
            {selectedProject && editingProject && (
              <Tabs defaultValue="editor" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3 bg-gray-900 mx-4 mt-2 flex-shrink-0">
                  <TabsTrigger value="editor">📖 Editor</TabsTrigger>
                  <TabsTrigger value="project">⚙️ Settings</TabsTrigger>
                  <TabsTrigger value="publish">🚀 Publish</TabsTrigger>
                </TabsList>

                {/* EDITOR TAB */}
                <TabsContent value="editor" className="flex-1 flex flex-col overflow-hidden p-4 m-0">
                  {currentChapter ?  (
                    <div className="flex flex-col h-full space-y-3">
                      {/* CHAPTER NAVIGATION */}
                      <div className="flex gap-3 items-center bg-gray-900 p-4 rounded border border-red-600/30 flex-shrink-0">
                        <Button
                          onClick={goToPreviousChapter}
                          disabled={currentChapterIndex === 0}
                          variant="outline"
                          size="sm"
                          className="border-red-600/50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        
                        <Select value={currentChapterIndex.toString()} onValueChange={(val) => setCurrentChapterIndex(parseInt(val))}>
                          <SelectTrigger className="flex-1 bg-gray-800 border-red-600/50 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-red-600/50 max-h-[400px]">
                            {chapters.map((ch, idx) => (
                              <SelectItem key={ch.id} value={idx.toString()} className="text-white hover:bg-red-600/20">
                                Ch {ch.chapter_number}:  {ch.title} ({ch.word_count}w)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          onClick={goToNextChapter}
                          disabled={currentChapterIndex === chapters.length - 1}
                          variant="outline"
                          size="sm"
                          className="border-red-600/50"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                          onClick={handleSaveChapter}
                          disabled={savingChapter}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {savingChapter ?  <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Save
                        </Button>

                        <Button
                          onClick={handleDeleteChapter}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* CHAPTER TITLE */}
                      <div className="flex-shrink-0">
                        <Label className="text-white">Chapter Title</Label>
                        <Input
                          value={currentChapter.title}
                          onChange={(e) => setCurrentChapter({ ...currentChapter, title: e.target.value })}
                          className="text-xl font-bold bg-gray-900 border-red-600/50 text-white"
                        />
                      </div>

                      {/* SCROLLABLE CONTENT EDITOR */}
                      <div className="flex-1 flex flex-col overflow-hidden">
                        <Label className="text-white mb-2 flex-shrink-0">Chapter Content</Label>
                        <ScrollArea className="flex-1 border border-red-600/50 rounded">
                          <Textarea
                            value={currentChapter.content}
                            onChange={(e) => setCurrentChapter({ ...currentChapter, content: e.target.value })}
                            className="min-h-[600px] w-full font-serif text-base leading-relaxed bg-gray-900 border-0 text-white resize-none"
                            style={{ height: '100%' }}
                          />
                        </ScrollArea>
                      </div>

                      {/* WORD COUNT */}
                      <div className="text-sm text-gray-400 flex-shrink-0">
                        Words: {currentChapter.content.trim().split(/\s+/).filter(w => w).length}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-gray-900 rounded border border-red-600/30">
                      {chapters.length === 0 ? '📭 No chapters yet' : 'Select a chapter'}
                    </div>
                  )}
                </TabsContent>

                {/* PROJECT SETTINGS TAB */}
                <TabsContent value="project" className="flex-1 overflow-hidden p-4 m-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4 bg-gray-900 p-6 rounded border border-red-600/30">
                      <div>
                        <Label className="text-white">Title</Label>
                        <Input
                          value={editingProject.title}
                          onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          className="bg-gray-800 border-red-600/50 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Genre</Label>
                        <Input
                          value={editingProject.genre}
                          onChange={(e) => setEditingProject({ ...editingProject, genre: e.target.value })}
                          className="bg-gray-800 border-red-600/50 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Description</Label>
                        <Textarea
                          value={editingProject.prompt}
                          onChange={(e) => setEditingProject({ ...editingProject, prompt: e.target.value })}
                          rows={6}
                          className="bg-gray-800 border-red-600/50 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Setting</Label>
                        <Input
                          value={editingProject.setting}
                          onChange={(e) => setEditingProject({ ...editingProject, setting: e.target.value })}
                          className="bg-gray-800 border-red-600/50 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Target Word Count</Label>
                        <Input
                          type="number"
                          value={editingProject.target_length}
                          onChange={(e) => setEditingProject({ ...editingProject, target_length: parseInt(e.target.value) || 50000 })}
                          className="bg-gray-800 border-red-600/50 text-white"
                        />
                      </div>
                      <Button onClick={handleSaveProject} disabled={savingProject} className="w-full bg-green-600 hover:bg-green-700">
                        {savingProject ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Settings
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* PUBLISH TAB */}
                <TabsContent value="publish" className="flex-1 overflow-hidden p-4 m-0">
                  <Card className="bg-blue-950/20 border-blue-600/30 p-6">
                    <h3 className="text-2xl font-bold text-white mb-4">{selectedProject. title}</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div>
                        <span className="text-gray-400">Chapters:</span>
                        <p className="text-2xl font-bold text-blue-600">{chapters.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Words:</span>
                        <p className="text-2xl font-bold text-blue-600">{chapters.reduce((sum, ch) => sum + ch.word_count, 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Genre:</span>
                        <p className="text-2xl font-bold text-blue-600 capitalize">{selectedProject.genre}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handlePublish}
                      disabled={publishing || chapters.length === 0}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Publishing... 
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-5 w-5" />
                          Publish to Occult Library
                        </>
                      )}
                    </Button>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}