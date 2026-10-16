import { useContext, type ComponentProps } from 'react';
import { Skeleton } from '@/components/ui';
import { SkeletonContext } from './skeletonContext';

type BoneProps = Omit<ComponentProps<typeof Skeleton>, 'animation'>;

/** MUI's `Skeleton`, held still when the viewer has asked for reduced motion. */
export function SkeletonBone(props: Readonly<BoneProps>) {
  const { animation } = useContext(SkeletonContext);
  return <Skeleton animation={animation} {...props} />;
}
