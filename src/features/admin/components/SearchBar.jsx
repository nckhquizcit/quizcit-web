export default function SearchBar({ placeholder, onChange }) {
  return (
    <div className="search-wrapper">
      <input
        className="search-input"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
