import React, { useEffect, useState } from "react";
import {
  IndexTable,
  LegacyCard,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  Badge,
  Button,
  Box,
  Spinner,
  Page,
  EmptySearchResult,
  Tooltip,
  InlineStack,
} from "@shopify/polaris";
import { RefreshIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function Overview() {

  const appBridge = useAppBridge();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [queryValue, setQueryValue] = useState("");
  const { mode, setMode } = useSetIndexFiltersMode();
  const rowsPerPage = 14;

  const [products, setProducts] = useState([]);

  // Fetch companies on mount/refresh
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      let url = `/api/customers?shop=${encodeURIComponent(appBridge.config.shop)}`;
      const response = await fetch(
        url,
        {
          method: "get",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
    setLoading(false);
    appBridge.toast.show('Company list refreshed', {
      duration: 3000,
    });
  };

  // Search companies
  const filteredCompanies = companies.filter((c) => {
    if (
      queryValue &&
      !(
        c.first_name?.toLowerCase().includes(queryValue.toLowerCase()) ||
        c.email?.toLowerCase().includes(queryValue.toLowerCase()) ||
        c.phone?.toLowerCase().includes(queryValue.toLowerCase()) ||
        c.gst_number?.toLowerCase().includes(queryValue.toLowerCase()) ||
        c.state?.toLowerCase().includes(queryValue.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });

  // Pagination logic (client-side)
  const totalPagesCalc = Math.max(1, Math.ceil(filteredCompanies.length / rowsPerPage));
  useEffect(() => {
    setTotalPages(totalPagesCalc);
    if (currentPage > totalPagesCalc) setCurrentPage(1);
  }, [filteredCompanies.length]);

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // IndexTable selection logic
  const resourceName = { singular: "company", plural: "companies" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(paginatedCompanies);

  // Table Row Rendering
  const rowMarkup = paginatedCompanies.map((company, index) => (
    <IndexTable.Row
      id={company._id}
      key={company._id}
      selected={selectedResources.includes(company._id)}
      position={index}
    >
      <IndexTable.Cell>
        <Text as="span" fontWeight="semibold">{(currentPage - 1) * rowsPerPage + index + 1}</Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{company.first_name}</IndexTable.Cell>
      <IndexTable.Cell>{company.email}</IndexTable.Cell>
      <IndexTable.Cell>{company.phone}</IndexTable.Cell>
      <IndexTable.Cell>{company.gst_number}</IndexTable.Cell>
      <IndexTable.Cell>{company.state}</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge
          tone={company.zohoContactStatus === "created" ? "success" : ""}
          size="medium"
        >
          {company.zohoContactStatus || "failed"}
        </Badge>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  const emptyStateMarkup = (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", minHeight: "468px" }}>
      <EmptySearchResult
        title={'No Company Found'}
        description={'Try changing the search term'}
        withIllustration
      />
    </div>

  );

  // Pagination handlers
  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const syncProducts = async () => {
    setLoadingProduct(true);
    try {
      let url = `/api/sync-products?shop=${encodeURIComponent(appBridge.config.shop)}`;
      const response = await fetch(
        url,
        {
          method: "get",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      console.log('product sync start', data)
    } catch (error) {
      console.error("Error syncing products:", error);
    }
    setLoadingProduct(false);
    appBridge.toast.show('All product synced to zoho', {
      duration: 3000,
    });
  };

  return (
    <Page fullWidth>
      <LegacyCard >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 13px', borderBottom: 'var(--p-border-width-025) solid var(--p-color-border)' }}>
          <Text as="p" variant="bodyLg" fontWeight="medium">List of Companies</Text>
          <div style={{ flex: 1 }}>
            <IndexFilters
              sortOptions={[]}
              sortSelected={[]}
              onSort={() => { }}
              queryValue={queryValue}
              queryPlaceholder="Search by name, email, phone, GST, state"
              onQueryChange={setQueryValue}
              onQueryClear={() => setQueryValue("")}
              filters={""}
              appliedFilters={""}
              onClearAll={() => {
                setQueryValue("");
              }}
              tabs={[]}
              selected={0}
              onSelect={() => { }}
              canCreateNewView={true}
              cancelAction={{
                onAction: () => { setQueryValue("") },
                disabled: false,
                loading: false,
              }}
              mode={mode}
              setMode={setMode}
            />
          </div>

          <Tooltip
            preferredPosition="above"
            content={
              <InlineStack gap="200">
                Refresh Companies
              </InlineStack>
            }
          >
            <Button
              variant="secondary"
              icon={RefreshIcon}
              loading={loading}
              onClick={fetchCompanies}
            />
          </Tooltip>
          <Tooltip
            preferredPosition="above"
            content={
              <InlineStack gap="200">
                Sync Product to zoho
              </InlineStack>
            }
          >
            <Button
              variant="secondary"
              icon={RefreshIcon}
              loading={loadingProduct}
              onClick={syncProducts}
            >Products </Button>
          </Tooltip>
        </div>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", minHeight: "541px" }}>
            <Spinner />
          </div>
        ) : (
          <IndexTable
            resourceName={resourceName}
            itemCount={paginatedCompanies.length}
            selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            emptyState={emptyStateMarkup}
            headings={[
              { title: "S.No." },
              { title: "Name" },
              { title: "Email" },
              { title: "Phone" },
              { title: "GST Number" },
              { title: "State" },
              { title: "Zoho Contact Status" },
            ]}
            condensed={false}
            pagination={{
              hasNext: (currentPage < totalPages) ? true : false,
              onNext: () => { handleNext() },
              hasPrevious: currentPage > 1 ? true : false,
              onPrevious: () => { handlePrevious() },
            }}

          >
            {rowMarkup}
          </IndexTable>
        )}
        {!loading && paginatedCompanies.length !== 0 && (
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", bottom: "11px", right: "19px", zIndex: "111" }}>Page {currentPage} of {totalPages}</span>
          </div>
        )}
      </LegacyCard>
    </Page>
  );
}
