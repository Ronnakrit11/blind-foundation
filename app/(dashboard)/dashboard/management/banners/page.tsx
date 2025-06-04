'use client';

import { useState, useEffect, startTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react';
import { useUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme-provider';
import { useActionState } from 'react';
import { createBanner, updateBanner, deleteBanner, getBanners, toggleBannerStatus } from './actions';
import type { Banner } from '@/lib/db/schema';
import Image from 'next/image';

export default function BannerManagementPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    altText: '',
    isActive: true as boolean,
    position: 0,
  });

  const [createState, createAction, isCreatePending] = useActionState(createBanner, {});
  const [updateState, updateAction, isUpdatePending] = useActionState(updateBanner, {});
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteBanner, {});
  const [toggleState, toggleAction, isTogglePending] = useActionState<any, any>(toggleBannerStatus, {});

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (createState.success || updateState.success || deleteState.success || toggleState.success) {
      toast.success(createState.success || updateState.success || deleteState.success || toggleState.success);
      setIsDialogOpen(false);
      resetForm();
      fetchBanners();
    }

    if (createState.error || updateState.error || deleteState.error || toggleState.error) {
      toast.error(createState.error || updateState.error || deleteState.error || toggleState.error);
    }
  }, [createState, updateState, deleteState, toggleState]);

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  async function fetchBanners() {
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to fetch banners');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const formDataObj = new FormData();
    formDataObj.append('title', formData.title);
    formDataObj.append('altText', formData.altText || formData.title);
    formDataObj.append('isActive', formData.isActive ? 'true' : 'false');
    formDataObj.append('position', formData.position.toString());

    // Get the file input element
    const fileInput = document.getElementById('banner-image') as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      formDataObj.append('image', fileInput.files[0]);
    } else if (!selectedBanner) {
      toast.error('Please select an image');
      return;
    }

    if (selectedBanner) {
      formDataObj.append('id', selectedBanner.id.toString());
      startTransition(() => {
        updateAction(formDataObj);
      });
    } else {
      startTransition(() => {
        createAction(formDataObj);
      });
    }
  }

  async function handleDelete(bannerId: number) {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    const formData = new FormData();
    formData.append('id', bannerId.toString());

    startTransition(() => {
      deleteAction(formData);
    });
  }

  async function handleToggleStatus(banner: Banner) {
    startTransition(() => {
      toggleAction({
        id: banner.id.toString(),
        isActive: !banner.isActive
      });
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      altText: '',
      isActive: true,
      position: 0,
    });
    setSelectedBanner(null);
    setImagePreview(null);
    
    // Reset file input
    const fileInput = document.getElementById('banner-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-lg lg:text-2xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          จัดการแบนเนอร์
        </h1>
        <Button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มแบนเนอร์
        </Button>
      </div>

      <Card className={isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : ''}>แบนเนอร์</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : banners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`flex flex-col border rounded-lg overflow-hidden ${
                    isDark 
                      ? 'bg-[#1a1a1a] border-[#2A2A2A] hover:bg-[#202020]' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative w-full h-48">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.altText || banner.title}
                      fill
                      className="object-cover"
                    />
                    {!banner.isActive && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium px-2 py-1 rounded-full bg-red-500">
                          ปิดการใช้งาน
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className={`font-medium ${isDark ? 'text-white' : ''}`}>
                      {banner.title}
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ตำแหน่ง: {banner.position}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBanner(banner);
                          setFormData({
                            title: banner.title,
                            altText: banner.altText || '',
                            isActive: banner.isActive === true, // Ensure it's a boolean
                            position: banner.position || 0,
                          });
                          setImagePreview(banner.imageUrl);
                          setIsDialogOpen(true);
                        }}
                        className={isDark ? 'border-[#2A2A2A] hover:bg-[#202020]' : ''}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        แก้ไข
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(banner)}
                        className={`${
                          isDark 
                            ? 'border-[#2A2A2A] hover:bg-[#202020]' 
                            : banner.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'
                        }`}
                        disabled={isTogglePending}
                      >
                        {banner.isActive ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            ปิดใช้งาน
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            เปิดใช้งาน
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                        className={`text-red-500 ${
                          isDark 
                            ? 'border-[#2A2A2A] hover:bg-[#202020]' 
                            : 'hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        ลบ
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              ไม่พบแบนเนอร์ คลิก "เพิ่มแบนเนอร์" เพื่อสร้างแบนเนอร์ใหม่
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`sm:max-w-md ${isDark ? 'bg-[#151515] border-[#2A2A2A]' : ''}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>
              {selectedBanner ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className={isDark ? 'text-white' : ''}>
                ชื่อแบนเนอร์
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
                required
              />
            </div>
            <div>
              <Label htmlFor="altText" className={isDark ? 'text-white' : ''}>
                คำอธิบายภาพ (Alt Text)
              </Label>
              <Input
                id="altText"
                value={formData.altText}
                onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
              />
            </div>
            <div>
              <Label htmlFor="position" className={isDark ? 'text-white' : ''}>
                ตำแหน่ง
              </Label>
              <Input
                id="position"
                type="number"
                min="0"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 0 })}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean | 'indeterminate') => {
                  const isActive = checked === true;
                  setFormData({ ...formData, isActive });
                }}
              />
              <Label 
                htmlFor="isActive"
                className={isDark ? 'text-white' : ''}
              >
                เปิดใช้งาน
              </Label>
            </div>
            <div>
              <Label htmlFor="banner-image" className={isDark ? 'text-white' : ''}>
                รูปภาพแบนเนอร์
              </Label>
              <Input
                id="banner-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={isDark ? 'bg-[#1a1a1a] border-[#2A2A2A] text-white' : ''}
              />
              {imagePreview && (
                <div className="mt-2 relative w-full h-40">
                  <Image
                    src={imagePreview}
                    alt="Banner preview"
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(false);
                }}
                className={isDark ? 'border-[#2A2A2A] hover:bg-[#202020] text-white' : ''}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isCreatePending || isUpdatePending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {(isCreatePending || isUpdatePending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึก'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
