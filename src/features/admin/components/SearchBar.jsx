import { Search } from "lucide-react";

export default function SearchBar({ placeholder, onChange, right }) {
  return (
    <div className="search-wrapper">
      <Search size={16} className="adm2-search-icon" aria-hidden="true" />
      <input
        className="search-input"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {right}
    </div>
  );
}
