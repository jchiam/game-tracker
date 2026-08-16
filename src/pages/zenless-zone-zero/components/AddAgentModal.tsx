import type { ZzzAgent } from '@/data/zenless-zone-zero/agents';
import type { ZzzTrackedAgent } from '@/types';
import { AddEntityModal } from '@/components/AddEntityModal';
import { getElementBadge, getRarityBadge, getSpecialtyBadge } from './agentBadges';

interface AddAgentModalProps {
  availableAgents: ZzzAgent[];
  trackedAgents: ZzzTrackedAgent[];
  onAddAgent: (agent: ZzzAgent) => void;
  onClose: () => void;
}

export function AddAgentModal({
  availableAgents,
  trackedAgents,
  onAddAgent,
  onClose,
}: AddAgentModalProps) {
  return (
    <AddEntityModal
      title="Add Agent"
      entityNoun="agents"
      available={availableAgents}
      tracked={trackedAgents}
      searchKeys={['name', 'specialty', 'element']}
      getBadges={(agent) => {
        const rarity = getRarityBadge(agent.rarity);
        const specialty = getSpecialtyBadge(agent.specialty);
        const element = getElementBadge(agent.element);
        return [
          { label: rarity.label, variant: 'zzz-rarity', modifier: rarity.modifier },
          { label: specialty.label, variant: 'zzz-specialty', modifier: specialty.modifier },
          { label: element.label, variant: 'zzz-element', modifier: element.modifier },
        ];
      }}
      onAdd={onAddAgent}
      onClose={onClose}
    />
  );
}
