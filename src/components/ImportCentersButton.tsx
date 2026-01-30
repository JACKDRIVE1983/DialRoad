import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import centersData from '@/data/centri_dialisi.json';
import { toast } from 'sonner';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';

export function ImportCentersButton() {
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('import-centers', {
        body: { centers: centersData }
      });

      if (error) {
        throw error;
      }

      console.log('[Import] Result:', data);
      toast.success(`Importati ${data.imported} centri su ${data.total}`);
      setImported(true);
    } catch (error) {
      console.error('[Import] Error:', error);
      toast.error('Errore durante l\'importazione');
    } finally {
      setIsImporting(false);
    }
  };

  if (imported) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <span>Dati importati con successo</span>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleImport} 
      disabled={isImporting}
      variant="outline"
      className="gap-2"
    >
      {isImporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Upload className="w-4 h-4" />
      )}
      {isImporting ? 'Importazione...' : 'Importa Centri nel Database'}
    </Button>
  );
}
