import React from "react";

export default function FormStatus({ error, success }) {
  if (!error && !success) return null;
  return <div className={error ? "notice error" : "notice success"}>{error || success}</div>;
}
