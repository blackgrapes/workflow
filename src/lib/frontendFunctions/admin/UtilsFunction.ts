export const generateEmployeeId = (department: string, type: "Manager" | "Employee") => {
  const deptMap: Record<string, string> = {
    "Customer Service": "CS",
    "Sourcing": "SO",
    "Shipping": "SH",
    "Sales": "SA",
  };
  const deptCode = deptMap[department] || "XX";
  const roleCode = type === "Manager" ? "MGR" : "EMP";
  const randomNum = Math.floor(1000 + Math.random() * 90000);
  return `${deptCode}-${roleCode}-${randomNum}`;
};

export const generatePassword = (length = 8) => {
  return Math.random().toString(36).slice(-length);
};
