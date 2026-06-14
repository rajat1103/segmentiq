/**
 * DatasetContext.jsx
 * Global context that stores the most recently uploaded customer CSV.
 * When CSVUploadModal successfully imports customers, it calls setDataset()
 * with the raw CSV text + metadata. SegmentAI reads this on mount and
 * automatically injects it into Prism's knowledge base — no re-upload needed.
 */
import { createContext, useContext, useState, useCallback } from "react";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [dataset, _setDataset] = useState(() => {
    try {
      const saved = localStorage.getItem("prism_dataset");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setDataset = useCallback((data) => {
    _setDataset(data);
    try {
      // Persist a truncated version (first 2000 chars of csvText to avoid LS quota)
      const toSave = {
        ...data,
        csvText: (data.csvText || "").slice(0, 15000),
      };
      localStorage.setItem("prism_dataset", JSON.stringify(toSave));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const clearDataset = useCallback(() => {
    _setDataset(null);
    localStorage.removeItem("prism_dataset");
  }, []);

  return (
    <DatasetContext.Provider value={{ dataset, setDataset, clearDataset }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used within DatasetProvider");
  return ctx;
}
