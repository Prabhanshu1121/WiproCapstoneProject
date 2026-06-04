import React from "react";

export default function StatCard({ label, value, accent = "mint" }) {
  return <div className={`stat ${accent}`}><span>{label}</span><strong>{value}</strong></div>;
}
