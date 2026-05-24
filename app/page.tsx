import { OSController } from '@/components/OSController';
import { StoreHydrator } from '@/components/StoreHydrator';

export default function Home() {
  return (
    <StoreHydrator>
      <OSController />
    </StoreHydrator>
  );
}
