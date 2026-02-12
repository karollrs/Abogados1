import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAttorneys } from "@/hooks/use-attorneys";

// ✅ Fallbacks por si aún no creaste los data files
let CASE_TYPES_FALLBACK = [
  "Lesiones personales",
  "Compensación laboral",
  "Derecho penal",
  "Derecho familiar",
  "Divorcios",
  "Inmigración",
];

let US_CITIES_FALLBACK: string[] = [];

try {
  // @ts-ignore
  const mod = require("@/data/caseTypes");
  if (Array.isArray(mod.CASE_TYPES)) CASE_TYPES_FALLBACK = mod.CASE_TYPES;
} catch {}

try {
  // @ts-ignore
  const mod = require("@/data/usCities");
  if (Array.isArray(mod.US_CITIES)) US_CITIES_FALLBACK = mod.US_CITIES;
} catch {}

const norm = (v: any) => String(v ?? "").trim();

export default function Attorneys() {
  // filtros
  const [q, setQ] = useState("");
  const [cityText, setCityText] = useState("");
  const [stateText, setStateText] = useState("");
  const [specialtyText, setSpecialtyText] = useState("");

  const { data, isLoading, error, refetch } = useAttorneys({
    q: q || undefined,
    city: cityText || undefined,
    state: stateText || undefined,
    specialty: specialtyText || undefined,
  });

  // modal create
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formSpecialties, setFormSpecialties] = useState<string[]>([]);

  const canSave = useMemo(() => !!norm(name) && !!norm(email), [name, email]);

  function toggleSpecialty(s: string) {
    setFormSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function createAttorney() {
    if (!canSave) return;
    setSaving(true);
    try {
      const r = await fetch("/api/attorneys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          city: formCity || null,
          state_province: formState || null,
          specialties: formSpecialties,
        }),
      });

      if (!r.ok) throw new Error(await r.text());

      setOpen(false);
      setName("");
      setEmail("");
      setPhone("");
      setFormCity("");
      setFormState("");
      setFormSpecialties([]);

      await refetch();
    } catch (e) {
      console.error(e);
      alert("Error creando abogado. Revisa consola/terminal.");
    } finally {
      setSaving(false);
    }
  }

  const CASE_TYPES = CASE_TYPES_FALLBACK;
  const US_CITIES = US_CITIES_FALLBACK;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Attorneys</h1>
              <p className="text-muted-foreground">
                Abogados de la empresa: datos, especialidades y búsqueda
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-foreground text-background hover:opacity-90 transition"
            >
              + Nuevo abogado
            </button>
          </div>

          {/* Filters */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Nombre / correo / teléfono</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar…"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Ciudad</label>
                <input
                  list={US_CITIES.length ? "us-cities" : undefined}
                  value={cityText}
                  onChange={(e) => setCityText(e.target.value)}
                  placeholder="Escribe una ciudad…"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                {US_CITIES.length ? (
                  <datalist id="us-cities">
                    {US_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Estado / Provincia</label>
                <input
                  value={stateText}
                  onChange={(e) => setStateText(e.target.value)}
                  placeholder="Ej: FL / CA"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Especialización</label>
                <input
                  list="case-types"
                  value={specialtyText}
                  onChange={(e) => setSpecialtyText(e.target.value)}
                  placeholder="Ej: Inmigración"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <datalist id="case-types">
                  {CASE_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Abogados</CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading && <div className="text-muted-foreground">Cargando…</div>}

              {error && (
                <div className="text-destructive">
                  Error cargando: {String((error as any)?.message ?? error)}
                </div>
              )}

              {!isLoading && !error && (!data || data.length === 0) && (
                <div className="text-muted-foreground">
                  No hay abogados para mostrar con estos filtros.
                </div>
              )}

              <div className="flex flex-col gap-4">
                {data?.map((a: any) => {
                  const state = a.stateProvince ?? a.state_province ?? "";
                  const city = a.city ?? "";
                  const specs = Array.isArray(a.specialties) ? a.specialties : [];

                  return (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-lg truncate">{a.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{a.email}</div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Teléfono</div>
                          <div>{a.phone ?? "—"}</div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground">Ubicación</div>
                          <div>{[city, state].filter(Boolean).join(", ") || "—"}</div>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground">Especialidades</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {specs.length ? (
                              specs.map((s: string) => (
                                <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs">
                                  {s}
                                </span>
                              ))
                            ) : (
                              "—"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Nuevo abogado */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar nuevo abogado</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nombre *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Correo *</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Teléfono</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Ciudad</label>
              <input
                list={US_CITIES.length ? "us-cities-form" : undefined}
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              {US_CITIES.length ? (
                <datalist id="us-cities-form">
                  {US_CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Estado / Provincia</label>
              <input
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium">Especialidades</div>
            <div className="flex flex-wrap gap-2">
              {CASE_TYPES.map((s) => {
                const active = formSpecialties.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialty(s)}
                    className={[
                      "rounded-full px-3 py-1 text-xs border transition",
                      active
                        ? "bg-foreground text-background border-foreground"
                        : "bg-muted border-border hover:bg-muted/70",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={!canSave || saving}
              onClick={createAttorney}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}