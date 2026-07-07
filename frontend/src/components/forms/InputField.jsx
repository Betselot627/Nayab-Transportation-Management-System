const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
};

export default InputField;
