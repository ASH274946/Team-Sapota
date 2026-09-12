import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, ChevronDown, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/base-ui/avatar';
import {
  PRESET_AVATARS,
  getDefaultAvatarByGender,
  DEFAULT_MALE_AVATAR,
  DEFAULT_FEMALE_AVATAR,
} from '@/config/avatars.config';

export interface ProfileData {
    fullName: string;
    email: string;
    gender: 'male' | 'female' | 'other';
    timezone: string;
    role: string;
    avatarUrl: string;
    lastUpdated: string;
}

interface EditProfileProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ProfileData;
    onSave: (data: ProfileData) => void;
}

export const EditProfile: React.FC<EditProfileProps> = ({
    isOpen,
    onClose,
    initialData,
    onSave
}) => {
    const [formData, setFormData] = useState<ProfileData>(initialData);
    const [showPresetPicker, setShowPresetPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => {
                setFormData(initialData);
                setShowPresetPicker(false);
            });
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'gender') {
            const newGender = value as 'male' | 'female' | 'other';
            const isUsingDefaultAvatar =
              !formData.avatarUrl ||
              formData.avatarUrl === DEFAULT_MALE_AVATAR ||
              formData.avatarUrl === DEFAULT_FEMALE_AVATAR ||
              PRESET_AVATARS.some((p) => p.url === formData.avatarUrl);

            setFormData((prev) => ({
                ...prev,
                gender: newGender,
                avatarUrl: isUsingDefaultAvatar
                  ? getDefaultAvatarByGender(newGender)
                  : prev.avatarUrl,
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setFormData((prev) => ({ ...prev, avatarUrl: event.target!.result as string }));
            }
        };
        reader.readAsDataURL(file);
    };

    const getInitials = (name: string) =>
        name
            .split(/\s+/)
            .map((word) => word.slice(0, 1))
            .join('')
            .toUpperCase()
            .slice(0, 2);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-y-auto">
                    {/* Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 backdrop-blur-[1px] bg-black/20 dark:bg-black/60"
                    />

                    {/* Hidden file input for custom avatar editing */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />

                    {/* Modal Container */}
                    <div className="relative w-full max-w-180 z-101 my-auto pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.8 }}
                            className="pointer-events-auto w-full rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] border overflow-hidden bg-[#F5F5F7] border-[#E5E5EA]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 md:px-8 bg-[#F5F5F7]">
                                <h2 className="text-[18px] font-bold text-[#111111]">Edit your profile</h2>
                                <button title='close' onClick={onClose} className="text-[#8E8E93] hover:text-[#111111] transition-colors p-1 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col md:flex-row border-t-[1.6px] border-b-[1.6px] border-[#EAE9F2] bg-white">

                                {/* Form Section */}
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#636366]">Full name</label>
                                        <input title='fullname'
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none transition-all text-[15px] font-semibold bg-white border-[#DFDDE6] text-[#111111] focus:border-black"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#636366]">Email</label>
                                        <input title='email'
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-[14px] border-[1.5px] outline-none font-semibold transition-all text-[15px] bg-white border-[#DFDDE6] text-[#111111] focus:border-black"
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#636366]">Gender</label>
                                            <div className="relative">
                                                <select title='gender'
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-[14px] border appearance-none outline-none text-[15px] font-semibold bg-white border-[#DFDDE6] text-[#111111] focus:border-black cursor-pointer capitalize"
                                                >
                                                    <option value="male">Male (Default Avatar: Alex)</option>
                                                    <option value="female">Female (Default Avatar: Olivia)</option>
                                                    <option value="other">Other / Non-Binary</option>
                                                </select>
                                                <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#111111]/40" />
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            <label className="text-[14px] font-medium text-[#636366]">Timezone</label>
                                            <div className="relative">
                                                <select title='timezone'
                                                    name="timezone"
                                                    value={formData.timezone}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2.5 rounded-[14px] border appearance-none outline-none text-[15px] font-semibold bg-white border-[#DFDDE6] text-[#111111] focus:border-black cursor-pointer"
                                                >
                                                    <option value="GMT-8">GMT-8</option>
                                                    <option value="GMT-5">GMT-5</option>
                                                    <option value="GMT+0">GMT+0</option>
                                                    <option value="GMT+1">GMT+1</option>
                                                    <option value="GMT+5:30">GMT+5:30</option>
                                                    <option value="GMT+5">GMT+5</option>
                                                    <option value="GMT+8">GMT+8</option>
                                                </select>
                                                <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#111111]/40" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[14px] font-medium text-[#636366]">Role</label>
                                        <input title='role'
                                            name="role"
                                            value={formData.role}
                                            readOnly
                                            disabled
                                            className="w-full px-4 py-2.5 rounded-[14px] border outline-none text-[14px] font-semibold cursor-not-allowed opacity-75 bg-[#F3F3F5] border-[#E2E2E6] text-[#555558]"
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-full h-[1.6px] md:h-auto md:w-[1.6px] border-t md:border-t-0 md:border-l border-dashed border-[#E9E8EB]" />

                                {/* Preview & Preset Avatar Grid Section */}
                                <div className="flex-1 p-6 flex flex-col items-center justify-center bg-white">
                                    <span className="text-[14px] font-medium mb-3 text-[#636366]">Preview</span>
                                    
                                    <div className="relative mb-3">
                                        <Avatar className="w-28 h-28 ring-2 ring-[#f0f0f0] shadow-sm">
                                            <AvatarImage src={formData.avatarUrl} alt={formData.fullName} />
                                            <AvatarFallback className="text-2xl font-bold bg-[#6B8E9E] text-white">
                                                {getInitials(formData.fullName || 'User')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <button
                                            type="button"
                                            title='edit avatar'
                                            onClick={() => setShowPresetPicker(!showPresetPicker)}
                                            className="absolute bottom-0 right-0 p-2 rounded-full shadow-md border cursor-pointer hover:bg-gray-100 transition-colors bg-white border-[#f0f0f0] text-[#707070]/70"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                    </div>

                                    <h3 className="text-[17px] font-bold text-[#111111] text-center">{formData.fullName || 'Your Name'}</h3>
                                    <p className="text-[13px] mb-3 text-[#636366] text-center">{formData.role || 'Role'}</p>

                                    {/* Choose Avatar Presets */}
                                    <div className="w-full mt-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[12px] font-bold text-[#636366]">
                                                Choose Preset Avatar
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Upload Custom
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-center gap-3 p-2.5 rounded-xl border bg-[#F8F8FA] border-[#E8E8EE]">
                                            {PRESET_AVATARS.map((preset) => {
                                                const isSelected = formData.avatarUrl === preset.url;
                                                return (
                                                    <button
                                                        key={preset.id}
                                                        type="button"
                                                        title={`${preset.name} (${preset.gender})`}
                                                        onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: preset.url }))}
                                                        className={`relative rounded-full p-0.5 transition-all cursor-pointer ${
                                                            isSelected ? 'ring-2 ring-emerald-500 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <Avatar className="w-10 h-10">
                                                            <AvatarImage src={preset.url} alt={preset.name} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {getInitials(preset.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        {isSelected && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                                                <Check size={10} />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-5 md:px-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 bg-[#F5F5F7]">
                                <span className="text-[13px] text-[#767578]">
                                    Last updated: <span className="font-medium">{formData.lastUpdated || 'Just now'}</span>
                                </span>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 sm:flex-none px-5 py-2 rounded-full text-[14px] border-[1.6px] font-bold transition-colors cursor-pointer bg-[#ffffff] border-[#E2E2E6] text-[#0F0F0F] hover:bg-gray-100 shadow-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSave(formData)}
                                        className="flex-1 sm:flex-none px-5 py-2 rounded-full text-[13px] font-bold transition-colors shadow-lg shadow-black/10 cursor-pointer bg-[#0F0F0F] text-white hover:bg-[#222222]"
                                    >
                                        Save changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};
