import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useApiGet } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface Config {
  id: string;
  clasesGracia: number;
  diaVencimiento: number;
}

export function ConfigPage() {
  const token = useAuthStore((s) => s.token);
  const { data: config, mutate } = useApiGet<Config>('/config');

  const [clasesGracia, setClasesGracia] = useState('2');
  const [diaVencimiento, setDiaVencimiento] = useState('5');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setClasesGracia(String(config.clasesGracia));
      setDiaVencimiento(String(config.diaVencimiento));
    }
  }, [config]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await api('/config', {
      method: 'PATCH',
      body: JSON.stringify({
        clasesGracia: parseInt(clasesGracia, 10),
        diaVencimiento: parseInt(diaVencimiento, 10),
      }),
      token: token!,
    });
    mutate();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Configuración del Sistema</h2>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">Parámetros de acceso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clasesGracia">Clases de gracia (sin pago)</Label>
            <Input
              id="clasesGracia"
              type="number"
              min="0"
              max="10"
              value={clasesGracia}
              onChange={(e) => setClasesGracia(e.target.value)}
            />
            <p className="text-xs text-cefide-muted">
              Cantidad de clases que puede tomar un alumno sin pagar antes de quedar bloqueado
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diaVencimiento">Día de vencimiento</Label>
            <Input
              id="diaVencimiento"
              type="number"
              min="1"
              max="28"
              value={diaVencimiento}
              onChange={(e) => setDiaVencimiento(e.target.value)}
            />
            <p className="text-xs text-cefide-muted">
              Día del mes en que se considera vencido el período de pago
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            {saved && (
              <span className="text-sm text-cefide-success">Guardado</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
