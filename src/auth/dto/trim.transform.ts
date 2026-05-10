export function trimString(field: { value: unknown }): unknown {
  return typeof field.value === 'string' ? field.value.trim() : field.value;
}
