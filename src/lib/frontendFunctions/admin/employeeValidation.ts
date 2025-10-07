
interface FormData {
  name: string;
  role: string;
  phone: string;
  location: string;
}

interface FormErrors {
  name: string;
  role: string;
  phone: string;
  location: string;
}

// Validation function
export function validateEmployeeForm(form: FormData): { valid: boolean; errors: FormErrors } {
  let valid = true;
  const errors: FormErrors = { name: "", role: "", phone: "", location: "" };

  // Name validation: alphabets only, max 16 chars
  if (!/^[A-Za-z\s]{1,16}$/.test(form.name)) {
    errors.name = "Name must be alphabets only (max 16 chars)";
    valid = false;
  }

  // Role validation: alphabets only
  if (!/^[A-Za-z\s]+$/.test(form.role)) {
    errors.role = "Role must contain alphabets only";
    valid = false;
  }

  // Location validation: alphabets only
  if (form.location && !/^[A-Za-z\s]+$/.test(form.location)) {
    errors.location = "Location must contain alphabets only";
    valid = false;
  }

  // Phone validation: numbers only
  if (!/^\d+$/.test(form.phone)) {
    errors.phone = "Phone must contain numbers only";
    valid = false;
  }

  return { valid, errors };
}
