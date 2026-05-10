import mongoose, { type QueryFilter } from 'mongoose';
import { Order, OrderSchema, type OrderDocument } from '../src/orders/schemas/order.schema';

const NOTES_PATTERN =
  /Departamento\s*\(\s*id\s*\)\s*:\s*([^;]+?)\s*;\s*Municipio\s*\(\s*id\s*\)\s*:\s*([^\s;]+)/i;

function extractLocationIds(notes: string): {
  departmentId: string;
  municipalityId: string;
} | null {
  const m = notes.match(NOTES_PATTERN);
  if (!m) {
    return null;
  }
  const departmentId = m[1].trim();
  const municipalityId = m[2].trim();
  if (!departmentId || !municipalityId) {
    return null;
  }
  return { departmentId, municipalityId };
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      'Define MONGODB_URI (ej. export MONGODB_URI=... antes de ejecutar).',
    );
  }

  await mongoose.connect(uri);
  const OrderModel = mongoose.model(Order.name, OrderSchema);

  const filter: QueryFilter<OrderDocument> = {
    $and: [
      {
        $or: [
          { departmentId: { $exists: false } },
          { departmentId: null },
          { departmentId: '' },
        ],
      },
      {
        $or: [
          { municipalityId: { $exists: false } },
          { municipalityId: null },
          { municipalityId: '' },
        ],
      },
    ],
    notes: { $type: 'string' as const, $nin: [''] },
  };

  const cursor = OrderModel.find(filter).cursor();
  let updated = 0;
  let scanned = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const parsed = extractLocationIds(String(doc.notes ?? ''));
    if (!parsed) {
      continue;
    }

    const result = await OrderModel.updateOne(
      { _id: doc._id },
      {
        $set: {
          departmentId: parsed.departmentId,
          municipalityId: parsed.municipalityId,
        },
      },
    );
    if (result.modifiedCount > 0) {
      updated += 1;
    }
  }

  console.log(`Escaneadas: ${scanned}, actualizadas: ${updated}`);
  await mongoose.disconnect();
}

void main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
