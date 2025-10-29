import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

;

// Ya no necesitamos el helper, usamos import.meta.env directamente

interface ImageData {
  id_imagen: number;
  nombre_archivo: string;
  ruta_archivo: string;
  tipo: string;
  tamanio_kb?: number;
  mime_type?: string;
  descripcion?: string;
}

export const useImages = () => {
  const { get } = useApi<ImageData[]>();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todas las imágenes
  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await get('/imagenes');
      setImages(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar imágenes');
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  // Obtener imagen por tipo
  const getImageByType = useCallback((tipo: string): ImageData | null => {
    return images.find(img => img.tipo === tipo) || null;
  }, [images]);

  // Obtener imagen por ID
  const getImageById = useCallback((id: number): ImageData | null => {
    return images.find(img => img.id_imagen === id) || null;
  }, [images]);

  // Obtener URL completa de la imagen
  const getImageUrl = useCallback((image: ImageData | null): string => {
    if (!image) return '';

    // Si la ruta ya es completa (http/https), usarla directamente
    if (image.ruta_archivo.startsWith('http')) {
      return image.ruta_archivo;
    }

    // Si es una ruta relativa, construir la URL completa
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return `${baseUrl}${image.ruta_archivo}`;
  }, []);

  // Hook específico para el escudo institucional
  const useInstitutionLogo = () => {
    const [logoUrl, setLogoUrl] = useState<string>('');

    useEffect(() => {
      const logo = getImageByType('escudo') || getImageByType('logo');
      setLogoUrl(getImageUrl(logo));
    }, [images]);

    return logoUrl;
  };

  // Cargar imágenes al montar el hook
  useEffect(() => {
    loadImages();
  }, [loadImages]);

  return {
    images,
    loading,
    error,
    loadImages,
    getImageByType,
    getImageById,
    getImageUrl,
    useInstitutionLogo
  };
};

// Hook específico para el escudo/logo institucional
export const useInstitutionLogo = () => {
  const { getImageByType, getImageUrl, loading, error } = useImages();
  const [logoUrl, setLogoUrl] = useState<string>('/escudo-temp.svg'); // Fallback

  useEffect(() => {
    const logo = getImageByType('escudo') || getImageByType('logo') || getImageByType('institucion');
    const url = getImageUrl(logo);

    if (url) {
      setLogoUrl(url);
    }
  }, [getImageByType, getImageUrl]);

  return {
    logoUrl,
    loading,
    error
  };
};