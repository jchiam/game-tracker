import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartiesView, type PartyViewConfig } from '@/components/parties/PartiesView';
import { renderWithProviders, createMockSession } from '@/test/utils';
import type { Party } from '@/types';
import { addToast } from '@/utils/toast';

vi.mock('@/utils/toast', () => ({ addToast: vi.fn() }));

interface TestEntity {
  id: string;
  name: string;
  imageUrl: string;
  element: string;
}

const entities: TestEntity[] = [
  { id: 'alice', name: 'Alice', imageUrl: '/alice.webp', element: 'Fire' },
  { id: 'bob', name: 'Bob', imageUrl: '/bob.webp', element: 'Ice' },
];

const plainConfig: PartyViewConfig<TestEntity> = {
  nouns: {
    party: 'Party',
    partiesLower: 'parties',
    entity: 'character',
    header: 'Your Lineups',
    namePlaceholder: 'e.g. Test Stage 1-1',
    searchPlaceholder: 'Search character...',
  },
  resolveSlotImage: (e) => e.imageUrl,
  resolveListImage: (e) => e.imageUrl,
  slotAccentClass: (e) => `element-${e.element.toLowerCase()}`,
  supportsTier: false,
  supportsFavorite: false,
};

const fullConfig: PartyViewConfig<TestEntity> = {
  ...plainConfig,
  nouns: { ...plainConfig.nouns, party: 'Lineup', partiesLower: 'lineups' },
  supportsTier: true,
  supportsFavorite: true,
};

function makeParty(overrides: Partial<Party> = {}): Party {
  return {
    id: 'party-1',
    profileId: 'user-1',
    name: 'Team Alpha',
    notes: null,
    members: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultProps = {
  entities,
  parties: [] as Party[],
  onSaveParty: vi.fn().mockResolvedValue('party-1'),
  onDeleteParty: vi.fn().mockResolvedValue(true),
};

describe('PartiesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth and empty states', () => {
    it('shows sign-in prompt without a session, using the party noun', () => {
      renderWithProviders(<PartiesView config={plainConfig} {...defaultProps} session={null} />);
      expect(screen.getByText(/please sign in to track your party/i)).toBeInTheDocument();
      expect(screen.queryByText('Your Lineups')).not.toBeInTheDocument();
    });

    it('shows the empty state with the plural noun', () => {
      renderWithProviders(
        <PartiesView config={fullConfig} {...defaultProps} session={createMockSession()} />,
      );
      expect(screen.getByText(/no lineups configured yet/i)).toBeInTheDocument();
    });

    it('renders header and create button from config nouns', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      expect(screen.getByText('Your Lineups')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create New Party' })).toBeInTheDocument();
    });
  });

  describe('card grid', () => {
    it('renders one card per party with member entities resolved from the catalog', () => {
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          parties={[makeParty({ members: [{ entityId: 'alice', slotIndex: 0 }] })]}
          session={createMockSession()}
        />,
      );
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByAltText('Alice')).toBeInTheDocument();
    });

    it('applies the slot accent class to occupied slots', () => {
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          parties={[makeParty({ members: [{ entityId: 'alice', slotIndex: 0 }] })]}
          session={createMockSession()}
        />,
      );
      expect(screen.getByAltText('Alice').closest('.slot-avatar')).toHaveClass('element-fire');
    });

    it('calls onDeleteParty with the party id', () => {
      const onDeleteParty = vi.fn().mockResolvedValue(true);
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          parties={[makeParty()]}
          onDeleteParty={onDeleteParty}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByTitle('Delete Party'));
      expect(onDeleteParty).toHaveBeenCalledWith('party-1');
    });
  });

  describe('tier and favorite (full config)', () => {
    it('shows the tier banner when the party has a tier', () => {
      renderWithProviders(
        <PartiesView
          config={fullConfig}
          {...defaultProps}
          parties={[makeParty({ tier: 'S+' })]}
          onToggleFavorite={vi.fn()}
          session={createMockSession()}
        />,
      );
      expect(screen.getByText('S+')).toBeInTheDocument();
    });

    it('hides tier banner and favorite star on the plain config', () => {
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          parties={[makeParty({ tier: 'S+', isFavorited: true })]}
          session={createMockSession()}
        />,
      );
      expect(screen.queryByText('S+')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Favourite')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Unfavourite')).not.toBeInTheDocument();
    });

    it('toggles favorite with the inverted value', () => {
      const onToggleFavorite = vi.fn();
      renderWithProviders(
        <PartiesView
          config={fullConfig}
          {...defaultProps}
          parties={[makeParty({ isFavorited: false })]}
          onToggleFavorite={onToggleFavorite}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByTitle('Favourite'));
      expect(onToggleFavorite).toHaveBeenCalledWith('party-1', true);
    });

    it('sorts favorites first, then by tier rank', () => {
      renderWithProviders(
        <PartiesView
          config={fullConfig}
          {...defaultProps}
          parties={[
            makeParty({ id: 'p1', name: 'Untiered', tier: null }),
            makeParty({ id: 'p2', name: 'Tier B', tier: 'B' }),
            makeParty({ id: 'p3', name: 'Tier S', tier: 'S' }),
            makeParty({ id: 'p4', name: 'Fav', tier: null, isFavorited: true }),
          ]}
          onToggleFavorite={vi.fn()}
          session={createMockSession()}
        />,
      );
      const names = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
      expect(names).toEqual(['Fav', 'Tier S', 'Tier B', 'Untiered']);
    });
  });

  describe('editor modal', () => {
    it('opens the create editor and saves a named party', async () => {
      const user = userEvent.setup();
      const onSaveParty = vi.fn().mockResolvedValue('party-1');
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          onSaveParty={onSaveParty}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      expect(screen.getByRole('heading', { name: 'Create New Party' })).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText(/test stage/i), 'My Party');
      fireEvent.click(screen.getByRole('button', { name: 'Save Party' }));
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Create New Party' })).not.toBeInTheDocument();
      });
      expect(onSaveParty).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Party', members: [] }),
      );
      expect(onSaveParty.mock.calls[0][0]).not.toHaveProperty('tier');
    });

    it('Escape closes the editor when no slot picker is open', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      expect(screen.getByRole('heading', { name: 'Create New Party' })).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('heading', { name: 'Create New Party' })).not.toBeInTheDocument();
    });

    it('Escape with the slot picker open dismisses the picker, not the editor', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      fireEvent.click(screen.getByText('Slot 1'));
      expect(document.querySelector('.character-picker')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(document.querySelector('.character-picker')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create New Party' })).toBeInTheDocument();
    });

    it('saves typed notes in the payload', async () => {
      const user = userEvent.setup();
      const onSaveParty = vi.fn().mockResolvedValue('party-1');
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          onSaveParty={onSaveParty}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      await user.type(screen.getByPlaceholderText(/test stage/i), 'Notes Party');
      await user.type(screen.getByPlaceholderText(/strategy/i), 'burst rotation');
      fireEvent.click(screen.getByRole('button', { name: 'Save Party' }));
      await waitFor(() =>
        expect(onSaveParty).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Notes Party', notes: 'burst rotation' }),
        ),
      );
    });

    it('the picker Cancel button dismisses the picker and keeps the editor open', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      fireEvent.click(screen.getByText('Slot 1'));
      const picker = document.querySelector('.character-picker') as HTMLElement;
      expect(picker).toBeInTheDocument();
      fireEvent.click(within(picker).getByRole('button', { name: 'Cancel' }));
      expect(document.querySelector('.character-picker')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create New Party' })).toBeInTheDocument();
    });

    it('includes tier in the save payload when the config supports it', async () => {
      const user = userEvent.setup();
      const onSaveParty = vi.fn().mockResolvedValue('party-1');
      renderWithProviders(
        <PartiesView
          config={fullConfig}
          {...defaultProps}
          onSaveParty={onSaveParty}
          onToggleFavorite={vi.fn()}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Lineup' }));
      await user.type(screen.getByPlaceholderText(/test stage/i), 'Tiered');
      fireEvent.click(screen.getByRole('button', { name: 'S+' }));
      fireEvent.click(screen.getByRole('button', { name: 'Save Lineup' }));
      await waitFor(() =>
        expect(onSaveParty).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Tiered', tier: 'S+' }),
        ),
      );
    });

    it('hides the tier selector on the plain config', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      expect(screen.queryByText('Tier')).not.toBeInTheDocument();
    });

    it('warns and keeps the modal open when the name is empty', () => {
      const onSaveParty = vi.fn();
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          onSaveParty={onSaveParty}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      fireEvent.click(screen.getByRole('button', { name: 'Save Party' }));
      expect(onSaveParty).not.toHaveBeenCalled();
      expect(addToast).toHaveBeenCalledWith('Please enter a party name.', 'warning');
    });

    it('opens the edit editor prefilled from the party', () => {
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          parties={[makeParty({ name: 'Team Alpha', notes: 'strategy' })]}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByTitle('Edit Party'));
      expect(screen.getByRole('heading', { name: 'Edit Party' })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Team Alpha')).toBeInTheDocument();
      expect(screen.getByDisplayValue('strategy')).toBeInTheDocument();
    });
  });

  describe('team slot editing', () => {
    function openEditorWithPicker() {
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      fireEvent.click(screen.getByText('Slot 1'));
    }

    it('adds a picked entity to the active slot', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      openEditorWithPicker();
      const picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.click(within(picker).getByText('Alice'));
      expect(screen.getByAltText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Slot 1')).not.toBeInTheDocument();
    });

    it('excludes already-added members and honours the search filter', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      openEditorWithPicker();
      let picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.click(within(picker).getByText('Alice'));

      fireEvent.click(screen.getByText('Slot 2'));
      picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      expect(within(picker).queryByText('Alice')).not.toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Search character...'), {
        target: { value: 'zzz' },
      });
      expect(within(picker).queryByText('Bob')).not.toBeInTheDocument();
    });

    it('hides entities sharing an exclusion group with a selected member', () => {
      const tbEntities: TestEntity[] = [
        ...entities,
        { id: 'tb-a', name: 'Blazer A', imageUrl: '/tb-a.webp', element: 'Fire' },
        { id: 'tb-b', name: 'Blazer B', imageUrl: '/tb-b.webp', element: 'Ice' },
      ];
      const exclusionConfig: PartyViewConfig<TestEntity> = {
        ...plainConfig,
        exclusionGroup: (e) => (e.id.startsWith('tb-') ? 'trailblazer' : null),
      };
      renderWithProviders(
        <PartiesView
          config={exclusionConfig}
          {...defaultProps}
          entities={tbEntities}
          session={createMockSession()}
        />,
      );
      openEditorWithPicker();
      let picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.click(within(picker).getByText('Blazer A'));

      // Sibling form hidden, ungrouped entities still selectable
      fireEvent.click(screen.getByText('Slot 2'));
      picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      expect(within(picker).queryByText('Blazer B')).not.toBeInTheDocument();
      expect(within(picker).getByText('Alice')).toBeInTheDocument();
      expect(within(picker).getByText('Bob')).toBeInTheDocument();

      // Removing the group member frees the group again
      fireEvent.click(within(picker).getByText('Cancel'));
      fireEvent.click(document.querySelector('.remove-member-btn') as HTMLElement);
      fireEvent.click(screen.getByText('Slot 2'));
      picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      expect(within(picker).getByText('Blazer B')).toBeInTheDocument();
    });

    it('applies only the exact-duplicate filter when exclusionGroup is omitted', () => {
      const tbEntities: TestEntity[] = [
        ...entities,
        { id: 'tb-a', name: 'Blazer A', imageUrl: '/tb-a.webp', element: 'Fire' },
        { id: 'tb-b', name: 'Blazer B', imageUrl: '/tb-b.webp', element: 'Ice' },
      ];
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          entities={tbEntities}
          session={createMockSession()}
        />,
      );
      openEditorWithPicker();
      let picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.click(within(picker).getByText('Blazer A'));

      fireEvent.click(screen.getByText('Slot 2'));
      picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      expect(within(picker).queryByText('Blazer A')).not.toBeInTheDocument();
      expect(within(picker).getByText('Blazer B')).toBeInTheDocument();
    });

    it('removes a member from its slot', () => {
      renderWithProviders(
        <PartiesView config={plainConfig} {...defaultProps} session={createMockSession()} />,
      );
      openEditorWithPicker();
      const picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.click(within(picker).getByText('Alice'));
      fireEvent.click(document.querySelector('.remove-member-btn') as HTMLElement);
      expect(screen.queryByAltText('Alice')).not.toBeInTheDocument();
      expect(screen.getByText('Slot 1')).toBeInTheDocument();
    });

    it('saves the picked members as entityId/slotIndex pairs', async () => {
      const user = userEvent.setup();
      const onSaveParty = vi.fn().mockResolvedValue('party-1');
      renderWithProviders(
        <PartiesView
          config={plainConfig}
          {...defaultProps}
          onSaveParty={onSaveParty}
          session={createMockSession()}
        />,
      );
      openEditorWithPicker();
      const picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.click(within(picker).getByText('Alice'));
      await user.type(screen.getByPlaceholderText(/test stage/i), 'With Members');
      fireEvent.click(screen.getByRole('button', { name: 'Save Party' }));
      await waitFor(() =>
        expect(onSaveParty).toHaveBeenCalledWith(
          expect.objectContaining({ members: [{ entityId: 'alice', slotIndex: 0 }] }),
        ),
      );
    });
  });

  describe('slot configuration', () => {
    const slotConfig: PartyViewConfig<TestEntity> = {
      ...plainConfig,
      slots: [
        { index: -1, fixed: { image: '/wonder.webp', name: 'Wonder' } },
        {
          index: 0,
          label: 'Fire Slot',
          entityFilter: (e) => e.element === 'Fire',
          searchPlaceholder: 'Search fire...',
        },
        { index: 1, label: 'Ice Slot', entityFilter: (e) => e.element === 'Ice' },
      ],
    };

    it('renders a fixed slot as a static image on the card', () => {
      renderWithProviders(
        <PartiesView
          config={slotConfig}
          {...defaultProps}
          parties={[makeParty({ members: [] })]}
          session={createMockSession()}
        />,
      );
      expect(screen.getByAltText('Wonder')).toBeInTheDocument();
    });

    it('uses slot labels for empty-slot placeholders and omits fixed slots from the builder flow', () => {
      renderWithProviders(
        <PartiesView config={slotConfig} {...defaultProps} session={createMockSession()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      expect(screen.getByText('Fire Slot')).toBeInTheDocument();
      expect(screen.getByText('Ice Slot')).toBeInTheDocument();
      expect(screen.queryByText('Slot 1')).not.toBeInTheDocument();
      // Fixed Wonder slot shows its static image, not an empty placeholder.
      expect(screen.getByAltText('Wonder')).toBeInTheDocument();
    });

    it('narrows the picker to entities passing the active slot entityFilter', () => {
      renderWithProviders(
        <PartiesView config={slotConfig} {...defaultProps} session={createMockSession()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      fireEvent.click(screen.getByText('Fire Slot'));
      const picker = screen
        .getByPlaceholderText('Search fire...')
        .closest('.character-picker') as HTMLElement;
      expect(within(picker).getByText('Alice')).toBeInTheDocument();
      expect(within(picker).queryByText('Bob')).not.toBeInTheDocument();
    });

    it('falls back to the config-level search placeholder when a slot omits its own', () => {
      renderWithProviders(
        <PartiesView config={slotConfig} {...defaultProps} session={createMockSession()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      fireEvent.click(screen.getByText('Ice Slot'));
      expect(screen.getByPlaceholderText('Search character...')).toBeInTheDocument();
    });
  });

  describe('member picker search', () => {
    interface SearchEntity {
      id: string;
      name: string;
      imageUrl: string;
      element: string;
      codename: string;
    }

    const searchEntities: SearchEntity[] = [
      { id: 'ren', name: 'Ren Amamiya', imageUrl: '/ren.webp', element: 'Fire', codename: 'Joker' },
      {
        id: 'ann',
        name: 'Ann Takamaki',
        imageUrl: '/ann.webp',
        element: 'Fire',
        codename: 'Panther',
      },
      { id: 'bob', name: 'Bob', imageUrl: '/bob.webp', element: 'Ice', codename: 'Robo' },
    ];

    const baseSearchConfig: PartyViewConfig<SearchEntity> = {
      nouns: {
        party: 'Party',
        partiesLower: 'parties',
        entity: 'character',
        header: 'Your Lineups',
        namePlaceholder: 'e.g. Test Stage 1-1',
        searchPlaceholder: 'Search character...',
      },
      resolveSlotImage: (e) => e.imageUrl,
      resolveListImage: (e) => e.imageUrl,
      supportsTier: false,
      supportsFavorite: false,
    };

    function openPicker(name = 'Create New Party') {
      fireEvent.click(screen.getByRole('button', { name }));
      fireEvent.click(screen.getByText('Slot 1'));
      return screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
    }

    it('matches a configured non-name field (codename) via searchKeys', () => {
      const config: PartyViewConfig<SearchEntity> = {
        ...baseSearchConfig,
        searchKeys: ['name', 'codename'],
      };
      renderWithProviders(
        <PartiesView
          config={config}
          {...defaultProps}
          entities={searchEntities}
          session={createMockSession()}
        />,
      );
      const picker = openPicker();
      fireEvent.change(within(picker).getByPlaceholderText('Search character...'), {
        target: { value: 'Joker' },
      });
      expect(within(picker).getByText('Ren Amamiya')).toBeInTheDocument();
      expect(within(picker).queryByText('Ann Takamaki')).not.toBeInTheDocument();
    });

    it('defaults to matching name only when searchKeys is omitted', () => {
      renderWithProviders(
        <PartiesView
          config={baseSearchConfig}
          {...defaultProps}
          entities={searchEntities}
          session={createMockSession()}
        />,
      );
      const picker = openPicker();
      // "Joker" is Ren's codename, not searched by default → no match.
      fireEvent.change(within(picker).getByPlaceholderText('Search character...'), {
        target: { value: 'Joker' },
      });
      expect(within(picker).queryByText('Ren Amamiya')).not.toBeInTheDocument();
      // A name term still matches.
      fireEvent.change(within(picker).getByPlaceholderText('Search character...'), {
        target: { value: 'Amamiya' },
      });
      expect(within(picker).getByText('Ren Amamiya')).toBeInTheDocument();
    });

    it('composes searchKeys with the slot entityFilter and already-added exclusion', () => {
      const config: PartyViewConfig<SearchEntity> = {
        ...baseSearchConfig,
        searchKeys: ['name', 'codename'],
        slots: [
          { index: 0, label: 'Fire Slot A', entityFilter: (e) => e.element === 'Fire' },
          { index: 1, label: 'Fire Slot B', entityFilter: (e) => e.element === 'Fire' },
          { index: 2, label: 'Ice Slot', entityFilter: (e) => e.element === 'Ice' },
        ],
      };
      renderWithProviders(
        <PartiesView
          config={config}
          {...defaultProps}
          entities={searchEntities}
          session={createMockSession()}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Create New Party' }));
      // Add Ren (Joker) to the first fire slot.
      fireEvent.click(screen.getByText('Fire Slot A'));
      let picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.click(within(picker).getByText('Ren Amamiya'));

      // Open the second fire slot and search by codename.
      fireEvent.click(screen.getByText('Fire Slot B'));
      picker = screen
        .getByPlaceholderText('Search character...')
        .closest('.character-picker') as HTMLElement;
      fireEvent.change(within(picker).getByPlaceholderText('Search character...'), {
        target: { value: 'Panther' },
      });
      // Ann (Panther, Fire) matches; Ren is already added; Bob is filtered out (Ice).
      expect(within(picker).getByText('Ann Takamaki')).toBeInTheDocument();
      expect(within(picker).queryByText('Ren Amamiya')).not.toBeInTheDocument();
      expect(within(picker).queryByText('Bob')).not.toBeInTheDocument();
    });
  });
});
