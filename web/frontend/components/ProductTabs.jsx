import {LegacyCard, Tabs} from '@shopify/polaris';
import {useState, useCallback} from 'react';
import { ProductTable } from './ProductTable';

export function ProductTabs() {
  const [selected, setSelected] = useState(0);

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    [],
  );

  const tabs = [
    {
      id: 'all-products',
      content: 'All Products',
      accessibilityLabel: 'All Products',
      panelID: 'content-1',
    },
    {
      id: 'low-inventory-products',
      content: 'Low inventory products',
      panelID: 'content-2',
    }
  ];

  return (
    <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
      <LegacyCard.Section title={tabs[selected].content}>
        <p>Tab {selected} selected</p>
        {selected == 0 ? (
            <ProductTable />
        ) : ''}
      </LegacyCard.Section>
    </Tabs>
  );
}