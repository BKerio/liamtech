"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import Select2, { type Option } from "./Select2";

type Props = {
  makes: { id: number; name: string }[];
  /** "home": stacked card on the home page. "browse": inline bar on listing pages. */
  variant: "home" | "browse";
  /** where results are shown */
  action: string;
  initial?: { make?: number; model?: number; year?: number };
};

export default function VehicleForm({ makes, variant, action, initial }: Props) {
  const router = useRouter();
  const [make, setMake] = useState(initial?.make ? String(initial.make) : "");
  const [model, setModel] = useState(initial?.model ? String(initial.model) : "");
  const [year, setYear] = useState(initial?.year ? String(initial.year) : "");
  const [models, setModels] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);

  useEffect(() => {
    setModels([]);
    if (!make) return;
    fetch(`/api/vehicles/models/?make=${make}`)
      .then((r) => r.json())
      .then((d) => setModels(d.results.map((m: { id: number; text: string }) => ({ value: String(m.id), label: m.text }))));
  }, [make]);

  useEffect(() => {
    setYears([]);
    if (!model) return;
    fetch(`/api/vehicles/years/?model=${model}`)
      .then((r) => r.json())
      .then((d) => setYears(d.results.map((y: number) => ({ value: String(y), label: String(y) }))));
  }, [model]);

  const makeOptions = makes.map((m) => ({ value: String(m.id), label: m.name }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (make) p.set("make", make);
    if (model) p.set("model", model);
    if (year) p.set("year", year);
    router.push(`${action}?${p.toString()}`);
  };

  const fields = (
    <>
      <Select2
        name="make"
        placeholder="Make"
        required
        options={makeOptions}
        value={make}
        onChange={(v) => {
          setMake(v);
          setModel("");
          setYear("");
        }}
      />
      <Select2
        name="model"
        placeholder="Model"
        required
        disabled={!make}
        options={models}
        value={model}
        onChange={(v) => {
          setModel(v);
          setYear("");
        }}
      />
      <Select2
        name="year"
        placeholder="Year (optional)"
        allowClear
        disabled={!model}
        options={years}
        value={year}
        onChange={setYear}
      />
    </>
  );

  if (variant === "home") {
    return (
      <form action={action} method="get" className="home-vehicle-form" onSubmit={submit}>
        {fields}
        <button type="submit" className="btn btn-primary btn-block">
          Search
        </button>
      </form>
    );
  }
  return (
    <form className="browse-search__form" action={action} method="get" onSubmit={submit}>
      {fields}
      <button type="submit" className="btn btn-primary">
        <Icon name="search" />
      </button>
    </form>
  );
}
