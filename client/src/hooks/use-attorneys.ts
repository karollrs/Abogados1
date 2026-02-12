import { useEffect, useMemo, useState } from "react";

export type Attorney = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  specialties: string[];
  createdAt: string;
};

type Filters = {
  q?: string;
  city?: string;
  state?: string;
  specialty?: string;
};

export function useAttorneys(filters: Filters) {
  const [data, setData] = useState<Attorney[] | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.city) sp.set("city", filters.city);
    if (filters.state) sp.set("state", filters.state);
    if (filters.specialty) sp.set("specialty", filters.specialty);
    const s = sp.toString();
    return s ? `?${s}` : "";
  }, [filters.q, filters.city, filters.state, filters.specialty]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/attorneys${query}`);
      if (!r.ok) throw new Error(await r.text());
      const json = await r.json();
      setData(json);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return { data, isLoading, error, refetch: fetchData };
}
