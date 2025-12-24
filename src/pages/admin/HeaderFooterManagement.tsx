import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout, Save, Plus, Trash2, Edit, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";

interface HeaderConfig {
  id?: string;
  logo_url?: string | null;
  logo_alt: string;
  tagline?: string | null;
  background_color: string;
  text_color: string;
  height: number;
  sticky: boolean;
  show_search: boolean;
  show_notifications: boolean;
  custom_css?: string | null;
  is_active: boolean;
}

interface FooterConfig {
  id?: string;
  copyright_text: string;
  social_links: any;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  background_color: string;
  text_color: string;
  show_social: boolean;
  show_contact: boolean;
  custom_html?: string | null;
  custom_css?: string | null;
  is_active: boolean;
}

interface NavigationMenu {
  id?: string;
  name: string;
  location: string;
  items: any;
  max_depth: number;
  show_icons: boolean;
  mobile_breakpoint: number;
  is_active: boolean;
  display_order: number;
}

export default function HeaderFooterManagement() {
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<HeaderConfig[]>([]);
  const [footers, setFooters] = useState<FooterConfig[]>([]);
  const [navMenus, setNavMenus] = useState<NavigationMenu[]>([]);
  
  const [headerForm, setHeaderForm] = useState<HeaderConfig>({
    logo_alt: 'Site Logo',
    background_color: '#000000',
    text_color: '#ffffff',
    height: 80,
    sticky: true,
    show_search: true,
    show_notifications: true,
    is_active: true
  });

  const [footerForm, setFooterForm] = useState<FooterConfig>({
    copyright_text: '© 2025 All Rights Reserved',
    social_links: [],
    background_color: '#111111',
    text_color: '#cccccc',
    show_social: true,
    show_contact: true,
    is_active: true
  });

  const [navForm, setNavForm] = useState<NavigationMenu>({
    name: '',
    location: 'header',
    items: [],
    max_depth: 3,
    show_icons: true,
    mobile_breakpoint: 768,
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [headersRes, footersRes, navRes] = await Promise.all([
        supabase.from('site_header').select('*').order('created_at', { ascending: false }),
        supabase.from('site_footer').select('*').order('created_at', { ascending: false }),
        supabase.from('navigation_menus').select('*').order('display_order')
      ]);

      if (headersRes.data) setHeaders(headersRes.data as HeaderConfig[]);
      if (footersRes.data) setFooters(footersRes.data as FooterConfig[]);
      if (navRes.data) setNavMenus(navRes.data as NavigationMenu[]);
    } catch (error: any) {
      toast.error('Error loading data: ' + error.message);
    }
  };

  const saveHeader = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = headerForm.id 
        ? { ...headerForm, updated_by: user.id }
        : { ...headerForm, created_by: user.id };

      const { error } = headerForm.id
        ? await supabase.from('site_header').update(payload).eq('id', headerForm.id)
        : await supabase.from('site_header').insert(payload);

      if (error) throw error;
      toast.success(headerForm.id ? 'Header updated' : 'Header created');
      fetchData();
      resetHeaderForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveFooter = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = footerForm.id
        ? { ...footerForm, updated_by: user.id }
        : { ...footerForm, created_by: user.id };

      const { error } = footerForm.id
        ? await supabase.from('site_footer').update(payload).eq('id', footerForm.id)
        : await supabase.from('site_footer').insert(payload);

      if (error) throw error;
      toast.success(footerForm.id ? 'Footer updated' : 'Footer created');
      fetchData();
      resetFooterForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNavigation = async () => {
    if (!navForm.name.trim()) {
      toast.error('Navigation name is required');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = navForm.id
        ? { ...navForm, updated_by: user.id }
        : { ...navForm, created_by: user.id };

      const { error } = navForm.id
        ? await supabase.from('navigation_menus').update(payload).eq('id', navForm.id)
        : await supabase.from('navigation_menus').insert(payload);

      if (error) throw error;
      toast.success(navForm.id ? 'Navigation updated' : 'Navigation created');
      fetchData();
      resetNavForm();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteHeader = async (id: string) => {
    if (!confirm('Delete this header configuration?')) return;
    try {
      const { error } = await supabase.from('site_header').delete().eq('id', id);
      if (error) throw error;
      toast.success('Header deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteFooter = async (id: string) => {
    if (!confirm('Delete this footer configuration?')) return;
    try {
      const { error } = await supabase.from('site_footer').delete().eq('id', id);
      if (error) throw error;
      toast.success('Footer deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const deleteNavigation = async (id: string) => {
    if (!confirm('Delete this navigation menu?')) return;
    try {
      const { error } = await supabase.from('navigation_menus').delete().eq('id', id);
      if (error) throw error;
      toast.success('Navigation deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetHeaderForm = () => {
    setHeaderForm({
      logo_alt: 'Site Logo',
      background_color: '#000000',
      text_color: '#ffffff',
      height: 80,
      sticky: true,
      show_search: true,
      show_notifications: true,
      is_active: true
    });
  };

  const resetFooterForm = () => {
    setFooterForm({
      copyright_text: '© 2025 All Rights Reserved',
      social_links: [],
      background_color: '#111111',
      text_color: '#cccccc',
      show_social: true,
      show_contact: true,
      is_active: true
    });
  };

  const resetNavForm = () => {
    setNavForm({
      name: '',
      location: 'header',
      items: [],
      max_depth: 3,
      show_icons: true,
      mobile_breakpoint: 768,
      is_active: true,
      display_order: 0
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Layout className="h-8 w-8 text-primary" />
          Header & Footer Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure site-wide header and footer. Full CRUD control.
        </p>
      </div>

      <Tabs defaultValue="header">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create/Edit Header</CardTitle>
              <CardDescription>Configure site header appearance and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={headerForm.logo_url || ''}
                    onChange={(e) => setHeaderForm({ ...headerForm, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo Alt Text</Label>
                  <Input
                    value={headerForm.logo_alt}
                    onChange={(e) => setHeaderForm({ ...headerForm, logo_alt: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tagline</Label>
                <Input
                  value={headerForm.tagline || ''}
                  onChange={(e) => setHeaderForm({ ...headerForm, tagline: e.target.value })}
                  placeholder="Optional tagline"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={headerForm.background_color}
                    onChange={(e) => setHeaderForm({ ...headerForm, background_color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={headerForm.text_color}
                    onChange={(e) => setHeaderForm({ ...headerForm, text_color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (px)</Label>
                  <Input
                    type="number"
                    value={headerForm.height}
                    onChange={(e) => setHeaderForm({ ...headerForm, height: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={headerForm.sticky}
                    onCheckedChange={(checked) => setHeaderForm({ ...headerForm, sticky: checked })}
                  />
                  <Label>Sticky Header</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={headerForm.show_search}
                    onCheckedChange={(checked) => setHeaderForm({ ...headerForm, show_search: checked })}
                  />
                  <Label>Show Search</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={headerForm.is_active}
                    onCheckedChange={(checked) => setHeaderForm({ ...headerForm, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea
                  value={headerForm.custom_css || ''}
                  onChange={(e) => setHeaderForm({ ...headerForm, custom_css: e.target.value })}
                  placeholder="Optional custom CSS"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveHeader} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {headerForm.id ? 'Update' : 'Create'} Header
                </Button>
                {headerForm.id && (
                  <Button variant="outline" onClick={resetHeaderForm}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Headers</CardTitle>
              <CardDescription>{headers.length} header configuration(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {headers.map((header) => (
                  <div key={header.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-3">
                      {header.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{header.logo_alt}</p>
                        <p className="text-sm text-muted-foreground">
                          {header.tagline || 'No tagline'} • {header.height}px
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setHeaderForm(header)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteHeader(header.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {headers.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No headers configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create/Edit Footer</CardTitle>
              <CardDescription>Configure site footer content and style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Copyright Text</Label>
                <Input
                  value={footerForm.copyright_text}
                  onChange={(e) => setFooterForm({ ...footerForm, copyright_text: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={footerForm.contact_email || ''}
                    onChange={(e) => setFooterForm({ ...footerForm, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={footerForm.contact_phone || ''}
                    onChange={(e) => setFooterForm({ ...footerForm, contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={footerForm.address || ''}
                    onChange={(e) => setFooterForm({ ...footerForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={footerForm.background_color}
                    onChange={(e) => setFooterForm({ ...footerForm, background_color: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={footerForm.text_color}
                    onChange={(e) => setFooterForm({ ...footerForm, text_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={footerForm.show_social}
                    onCheckedChange={(checked) => setFooterForm({ ...footerForm, show_social: checked })}
                  />
                  <Label>Show Social Links</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={footerForm.show_contact}
                    onCheckedChange={(checked) => setFooterForm({ ...footerForm, show_contact: checked })}
                  />
                  <Label>Show Contact Info</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={footerForm.is_active}
                    onCheckedChange={(checked) => setFooterForm({ ...footerForm, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom HTML</Label>
                <Textarea
                  value={footerForm.custom_html || ''}
                  onChange={(e) => setFooterForm({ ...footerForm, custom_html: e.target.value })}
                  rows={4}
                  placeholder="Optional custom HTML"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveFooter} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {footerForm.id ? 'Update' : 'Create'} Footer
                </Button>
                {footerForm.id && (
                  <Button variant="outline" onClick={resetFooterForm}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Footers</CardTitle>
              <CardDescription>{footers.length} footer configuration(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {footers.map((footer) => (
                  <div key={footer.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-3">
                      {footer.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{footer.copyright_text}</p>
                        <p className="text-sm text-muted-foreground">
                          {footer.contact_email || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setFooterForm(footer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteFooter(footer.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {footers.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No footers configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create/Edit Navigation Menu</CardTitle>
              <CardDescription>Build and manage site navigation menus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Menu Name *</Label>
                  <Input
                    value={navForm.name}
                    onChange={(e) => setNavForm({ ...navForm, name: e.target.value })}
                    placeholder="Main Navigation"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={navForm.location} onValueChange={(value) => setNavForm({ ...navForm, location: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Depth</Label>
                  <Input
                    type="number"
                    value={navForm.max_depth}
                    onChange={(e) => setNavForm({ ...navForm, max_depth: parseInt(e.target.value) })}
                    min={1}
                    max={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Breakpoint</Label>
                  <Input
                    type="number"
                    value={navForm.mobile_breakpoint}
                    onChange={(e) => setNavForm({ ...navForm, mobile_breakpoint: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={navForm.display_order}
                    onChange={(e) => setNavForm({ ...navForm, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={navForm.show_icons}
                    onCheckedChange={(checked) => setNavForm({ ...navForm, show_icons: checked })}
                  />
                  <Label>Show Icons</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={navForm.is_active}
                    onCheckedChange={(checked) => setNavForm({ ...navForm, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Menu Items (JSON)</Label>
                <Textarea
                  value={JSON.stringify(navForm.items, null, 2)}
                  onChange={(e) => {
                    try {
                      const items = JSON.parse(e.target.value);
                      setNavForm({ ...navForm, items });
                    } catch (err) {
                      // Invalid JSON, don't update
                    }
                  }}
                  rows={8}
                  placeholder='[{"label": "Home", "url": "/", "icon": "Home"}]'
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Format: {"[{label, url, icon?, children?: []}]"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveNavigation} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {navForm.id ? 'Update' : 'Create'} Navigation
                </Button>
                {navForm.id && (
                  <Button variant="outline" onClick={resetNavForm}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Navigation Menus</CardTitle>
              <CardDescription>{navMenus.length} navigation menu(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {navMenus.map((nav) => (
                  <div key={nav.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-3">
                      {nav.is_active ? (
                        <Eye className="h-4 w-4 text-green-500" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{nav.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {nav.location} • {nav.items.length} items • Order: {nav.display_order}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setNavForm(nav)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteNavigation(nav.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {navMenus.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No navigation menus configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}