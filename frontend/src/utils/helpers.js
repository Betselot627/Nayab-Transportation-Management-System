export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const getStatusColor = (status) => {
  const colors = {
    pending: "text-yellow-600 bg-yellow-100",
    "in-transit": "text-blue-600 bg-blue-100",
    delivered: "text-green-600 bg-green-100",
    cancelled: "text-red-600 bg-red-100",
    active: "text-green-600 bg-green-100",
    maintenance: "text-orange-600 bg-orange-100",
    inactive: "text-gray-600 bg-gray-100",
  };
  return colors[status] || "text-gray-600 bg-gray-100";
};
