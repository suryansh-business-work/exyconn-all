import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ProductStatus,
  useCreateProductMutation,
  useUpdateProductMutation,
} from '@exyconn/shell/graphql/generated';
import type { ProductRow } from './product.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  sku: z.string().trim().min(1, 'SKU is required'),
  price: z.coerce.number({ message: 'Price must be a number' }).min(0, 'Must be ≥ 0'),
  category: z.string().trim().min(1, 'Category is required'),
  stock: z.coerce
    .number({ message: 'Stock must be a number' })
    .int('Whole number')
    .min(0, 'Must be ≥ 0'),
  status: z.nativeEnum(ProductStatus),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ProductRow | null): Values => ({
  name: row?.name ?? '',
  sku: row?.sku ?? '',
  price: row?.price ?? 0,
  category: row?.category ?? '',
  stock: row?.stock ?? 0,
  status: row?.status ?? ProductStatus.Draft,
});

interface ProductFormProps {
  initial: ProductRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a product. */
export function ProductForm({ initial, onDone, onCancel }: ProductFormProps) {
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Product',
    initial,
    create: (values: Values) => createProduct({ variables: { input: values } }),
    update: (row, values) => updateProduct({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfTextField name="sku" label="SKU" />
      <RhfTextField name="price" label="Price" type="number" />
      <RhfTextField name="category" label="Category" />
      <RhfTextField name="stock" label="Stock" type="number" />
      <RhfSelect name="status" label="Status" options={enumOptions(Object.values(ProductStatus))} />
    </EntityForm>
  );
}
