function validate(schema, input) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const err = new Error('Validation failed');
    err.status = 400;
    err.details = parsed.error.flatten();
    throw err;
  }
  return parsed.data;
}

module.exports = { validate };
