# OUTPUT 1 — COMPLETE FOLDER TREE

> Dealer Inventory ERP — Frontend Foundation Blueprint v2.0
> Every file named. No pseudocode. Production-ready scaffold.

```
src/
│
├── main.jsx
├── vite-env.d.js
│
├── app/
│   ├── App.jsx
│   ├── Router.jsx
│   └── Providers.jsx
│
├── config/
│   ├── env.js
│   ├── app.config.js
│   ├── panels.config.js
│   └── permissions.config.js
│
├── routes/
│   ├── admin/
│   │   ├── AdminRoutes.jsx
│   │   ├── AdminPanelSkeleton.jsx
│   │   └── index.js
│   ├── dealer/
│   │   ├── DealerRoutes.jsx
│   │   ├── DealerPanelSkeleton.jsx
│   │   └── index.js
│   ├── employee/
│   │   ├── EmployeeRoutes.jsx
│   │   ├── EmployeePanelSkeleton.jsx
│   │   └── index.js
│   ├── service/
│   │   ├── ServiceRoutes.jsx
│   │   ├── ServicePanelSkeleton.jsx
│   │   └── index.js
│   ├── customer/
│   │   ├── CustomerRoutes.jsx
│   │   ├── CustomerPanelSkeleton.jsx
│   │   └── index.js
│   └── shared/
│       ├── SharedRoutes.jsx
│       └── index.js
│
├── layouts/
│   ├── AdminLayout.jsx
│   ├── DealerLayout.jsx
│   ├── EmployeeLayout.jsx
│   ├── ServiceLayout.jsx
│   ├── CustomerLayout.jsx
│   ├── AuthLayout.jsx
│   └── PublicLayout.jsx
│
├── pages/
│   ├── admin/
│   │   ├── AdminDashboardPage.jsx
│   │   ├── warehouses/
│   │   │   ├── WarehouseListPage.jsx
│   │   │   ├── WarehouseDetailPage.jsx
│   │   │   └── GRNPage.jsx
│   │   ├── dispatch/
│   │   │   ├── DispatchListPage.jsx
│   │   │   └── DispatchDetailPage.jsx
│   │   ├── inventory/
│   │   │   ├── InventoryListPage.jsx
│   │   │   └── InventoryDetailPage.jsx
│   │   ├── dealers/
│   │   │   ├── DealerListPage.jsx
│   │   │   ├── DealerDetailPage.jsx
│   │   │   └── DealerOnboardingPage.jsx
│   │   ├── employees/
│   │   │   ├── EmployeeListPage.jsx
│   │   │   └── EmployeeDetailPage.jsx
│   │   ├── settings/
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── GeneralSettingsPage.jsx
│   │   │   ├── GstSettingsPage.jsx
│   │   │   └── NotificationSettingsPage.jsx
│   │   └── audit-logs/
│   │       └── AuditLogPage.jsx
│   ├── dealer/
│   │   ├── DealerDashboardPage.jsx
│   │   ├── inventory/
│   │   │   ├── DealerInventoryListPage.jsx
│   │   │   └── DealerInventoryDetailPage.jsx
│   │   ├── billing/
│   │   │   ├── BillingListPage.jsx
│   │   │   ├── BillingNewPage.jsx
│   │   │   └── BillingDetailPage.jsx
│   │   ├── invoices/
│   │   │   ├── InvoiceListPage.jsx
│   │   │   └── InvoiceDetailPage.jsx
│   │   ├── warranty/
│   │   │   ├── WarrantyListPage.jsx
│   │   │   └── WarrantyDetailPage.jsx
│   │   └── team/
│   │       ├── TeamListPage.jsx
│   │       └── TeamPerformancePage.jsx
│   ├── employee/
│   │   ├── EmployeeDashboardPage.jsx
│   │   ├── tasks/
│   │   │   ├── TaskListPage.jsx
│   │   │   └── TaskDetailPage.jsx
│   │   ├── reports/
│   │   │   ├── ReportListPage.jsx
│   │   │   └── ReportDetailPage.jsx
│   │   ├── team/
│   │   │   └── TeamDashboardPage.jsx
│   │   └── approvals/
│   │       ├── ApprovalListPage.jsx
│   │       └── ApprovalDetailPage.jsx
│   ├── service/
│   │   ├── ServiceDashboardPage.jsx
│   │   ├── complaints/
│   │   │   ├── ComplaintListPage.jsx
│   │   │   ├── ComplaintNewPage.jsx
│   │   │   └── ComplaintDetailPage.jsx
│   │   ├── spare-parts/
│   │   │   ├── SparePartsListPage.jsx
│   │   │   └── SparePartsDetailPage.jsx
│   │   └── defective-returns/
│   │       ├── DefectiveReturnsListPage.jsx
│   │       └── DefectiveReturnsDetailPage.jsx
│   ├── customer/
│   │   ├── CustomerDashboardPage.jsx
│   │   ├── orders/
│   │   │   ├── OrderListPage.jsx
│   │   │   └── OrderDetailPage.jsx
│   │   ├── warranty/
│   │   │   ├── CustomerWarrantyListPage.jsx
│   │   │   └── CustomerWarrantyDetailPage.jsx
│   │   └── service-requests/
│   │       ├── ServiceRequestListPage.jsx
│   │       ├── ServiceRequestNewPage.jsx
│   │       └── ServiceRequestDetailPage.jsx
│   └── auth/
│       ├── LoginPage.jsx
│       ├── ForgotPasswordPage.jsx
│       ├── ResetPasswordPage.jsx
│       └── SessionExpiredPage.jsx
│
├── modules/
│   ├── inventory/
│   │   ├── components/
│   │   │   ├── InventoryTable.jsx
│   │   │   ├── InventoryFilters.jsx
│   │   │   ├── InventoryDetailHeader.jsx
│   │   │   ├── StockLevelBadge.jsx
│   │   │   └── InventoryBulkActions.jsx
│   │   ├── hooks/
│   │   │   ├── useInventoryFilters.js
│   │   │   ├── useInventoryExport.js
│   │   │   └── useStockAlert.js
│   │   ├── queries/
│   │   │   ├── useInventoryList.js
│   │   │   ├── useInventoryDetail.js
│   │   │   ├── useInventoryMutation.js
│   │   │   └── useInventoryPrefetch.js
│   │   ├── schemas/
│   │   │   └── inventoryForm.schema.js
│   │   ├── utils/
│   │   │   ├── inventoryHelpers.js
│   │   │   └── stockCalculations.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── dispatch/
│   │   ├── components/
│   │   │   ├── DispatchTable.jsx
│   │   │   ├── DispatchStatusTimeline.jsx
│   │   │   ├── DispatchForm.jsx
│   │   │   └── DispatchTrackingCard.jsx
│   │   ├── hooks/
│   │   │   ├── useDispatchFilters.js
│   │   │   └── useDispatchTracking.js
│   │   ├── queries/
│   │   │   ├── useDispatchList.js
│   │   │   ├── useDispatchDetail.js
│   │   │   └── useDispatchMutation.js
│   │   ├── schemas/
│   │   │   └── dispatchForm.schema.js
│   │   ├── utils/
│   │   │   └── dispatchHelpers.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── grn/
│   │   ├── components/
│   │   │   ├── GRNTable.jsx
│   │   │   ├── GRNForm.jsx
│   │   │   ├── GRNLineItems.jsx
│   │   │   └── GRNVerificationPanel.jsx
│   │   ├── hooks/
│   │   │   ├── useGRNFilters.js
│   │   │   └── useGRNVerification.js
│   │   ├── queries/
│   │   │   ├── useGRNList.js
│   │   │   ├── useGRNDetail.js
│   │   │   └── useGRNMutation.js
│   │   ├── schemas/
│   │   │   └── grnForm.schema.js
│   │   ├── utils/
│   │   │   └── grnHelpers.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── billing/
│   │   ├── components/
│   │   │   ├── BillingTable.jsx
│   │   │   ├── BillingForm.jsx
│   │   │   ├── BillingLineItems.jsx
│   │   │   ├── BillingSummary.jsx
│   │   │   └── BillNumberDisplay.jsx
│   │   ├── hooks/
│   │   │   ├── useBillingFilters.js
│   │   │   ├── useBillingCalculation.js
│   │   │   └── useBillNumber.js
│   │   ├── queries/
│   │   │   ├── useBillingList.js
│   │   │   ├── useBillingDetail.js
│   │   │   └── useBillingMutation.js
│   │   ├── schemas/
│   │   │   └── billingForm.schema.js
│   │   ├── utils/
│   │   │   ├── billingCalculations.js
│   │   │   └── billNumberFormat.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── gst/
│   │   ├── components/
│   │   │   ├── GSTBreakdown.jsx
│   │   │   ├── GSTINValidator.jsx
│   │   │   ├── HSNCodePicker.jsx
│   │   │   └── TaxSummaryCard.jsx
│   │   ├── hooks/
│   │   │   ├── useGSTCalculation.js
│   │   │   └── useHSNLookup.js
│   │   ├── queries/
│   │   │   ├── useGSTConfig.js
│   │   │   └── useHSNList.js
│   │   ├── schemas/
│   │   │   └── gstForm.schema.js
│   │   ├── utils/
│   │   │   ├── gstRateLookup.js
│   │   │   └── interstateDetection.js
│   │   └── index.js
│   ├── warranty/
│   │   ├── components/
│   │   │   ├── WarrantyTable.jsx
│   │   │   ├── WarrantyCard.jsx
│   │   │   ├── WarrantyClaimForm.jsx
│   │   │   └── WarrantyStatusBadge.jsx
│   │   ├── hooks/
│   │   │   ├── useWarrantyFilters.js
│   │   │   └── useWarrantyEligibility.js
│   │   ├── queries/
│   │   │   ├── useWarrantyList.js
│   │   │   ├── useWarrantyDetail.js
│   │   │   └── useWarrantyMutation.js
│   │   ├── schemas/
│   │   │   └── warrantyForm.schema.js
│   │   ├── utils/
│   │   │   └── warrantyHelpers.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── complaints/
│   │   ├── components/
│   │   │   ├── ComplaintTable.jsx
│   │   │   ├── ComplaintForm.jsx
│   │   │   ├── ComplaintPriorityBadge.jsx
│   │   │   ├── ComplaintTimeline.jsx
│   │   │   └── ComplaintEscalationPanel.jsx
│   │   ├── hooks/
│   │   │   ├── useComplaintFilters.js
│   │   │   └── useComplaintEscalation.js
│   │   ├── queries/
│   │   │   ├── useComplaintList.js
│   │   │   ├── useComplaintDetail.js
│   │   │   └── useComplaintMutation.js
│   │   ├── schemas/
│   │   │   └── complaintForm.schema.js
│   │   ├── utils/
│   │   │   ├── complaintHelpers.js
│   │   │   └── slaCalculations.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── spares/
│   │   ├── components/
│   │   │   ├── SparePartsTable.jsx
│   │   │   ├── SparePartsRequestForm.jsx
│   │   │   └── SparePartsAvailability.jsx
│   │   ├── hooks/
│   │   │   └── useSparePartsFilters.js
│   │   ├── queries/
│   │   │   ├── useSparePartsList.js
│   │   │   ├── useSparePartsDetail.js
│   │   │   └── useSparePartsMutation.js
│   │   ├── schemas/
│   │   │   └── sparesForm.schema.js
│   │   ├── utils/
│   │   │   └── sparesHelpers.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── returns/
│   │   ├── components/
│   │   │   ├── ReturnsTable.jsx
│   │   │   ├── DefectiveReturnForm.jsx
│   │   │   └── ReturnInspectionPanel.jsx
│   │   ├── hooks/
│   │   │   └── useReturnsFilters.js
│   │   ├── queries/
│   │   │   ├── useReturnsList.js
│   │   │   ├── useReturnsDetail.js
│   │   │   └── useReturnsMutation.js
│   │   ├── schemas/
│   │   │   └── returnsForm.schema.js
│   │   ├── utils/
│   │   │   └── returnsHelpers.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── employees/
│   │   ├── components/
│   │   │   ├── EmployeeTable.jsx
│   │   │   ├── EmployeeForm.jsx
│   │   │   ├── RoleAssignmentPanel.jsx
│   │   │   └── TeamHierarchyTree.jsx
│   │   ├── hooks/
│   │   │   ├── useEmployeeFilters.js
│   │   │   └── useTeamHierarchy.js
│   │   ├── queries/
│   │   │   ├── useEmployeeList.js
│   │   │   ├── useEmployeeDetail.js
│   │   │   └── useEmployeeMutation.js
│   │   ├── schemas/
│   │   │   └── employeeForm.schema.js
│   │   ├── utils/
│   │   │   └── employeeHelpers.js
│   │   ├── columns.config.js
│   │   └── index.js
│   ├── analytics/
│   │   ├── components/
│   │   │   ├── RevenueChart.jsx
│   │   │   ├── OrdersChart.jsx
│   │   │   ├── ComplaintsChart.jsx
│   │   │   ├── KPIDashboard.jsx
│   │   │   └── DateRangeFilter.jsx
│   │   ├── hooks/
│   │   │   ├── useDashboardKPIs.js
│   │   │   └── useChartData.js
│   │   ├── queries/
│   │   │   ├── useAnalyticsKPIs.js
│   │   │   ├── useRevenueAnalytics.js
│   │   │   ├── useInventoryAnalytics.js
│   │   │   └── useComplaintAnalytics.js
│   │   ├── utils/
│   │   │   ├── chartFormatters.js
│   │   │   └── kpiCalculations.js
│   │   └── index.js
│   └── notifications/
│       ├── components/
│       │   ├── NotificationList.jsx
│       │   ├── NotificationItem.jsx
│       │   ├── NotificationBell.jsx
│       │   └── NotificationPanel.jsx
│       ├── hooks/
│       │   ├── useNotifications.js
│       │   └── useNotificationSound.js
│       ├── queries/
│       │   ├── useNotificationList.js
│       │   ├── useNotificationInfinite.js
│       │   └── useNotificationMutation.js
│       ├── utils/
│       │   └── notificationHelpers.js
│       └── index.js
│
├── components/
│   ├── auth/
│   │   ├── AuthGuard.jsx
│   │   ├── PanelGuard.jsx
│   │   ├── PermissionGuard.jsx
│   │   └── RoleSwitcher.jsx
│   ├── ui/
│   │   ├── button.jsx
│   │   ├── input.jsx
│   │   ├── label.jsx
│   │   ├── select.jsx
│   │   ├── checkbox.jsx
│   │   ├── radio-group.jsx
│   │   ├── switch.jsx
│   │   ├── textarea.jsx
│   │   ├── badge.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── dropdown-menu.jsx
│   │   ├── popover.jsx
│   │   ├── tooltip.jsx
│   │   ├── separator.jsx
│   │   ├── skeleton.jsx
│   │   ├── avatar.jsx
│   │   ├── scroll-area.jsx
│   │   ├── sheet.jsx
│   │   ├── tabs.jsx
│   │   ├── table.jsx
│   │   ├── calendar.jsx
│   │   ├── command.jsx
│   │   ├── sonner.jsx
│   │   └── index.js
│   ├── layout/
│   │   ├── AppShell.jsx
│   │   ├── Sidebar.jsx
│   │   ├── SidebarItem.jsx
│   │   ├── SidebarGroup.jsx
│   │   ├── Topbar.jsx
│   │   ├── PageHeader.jsx
│   │   ├── MobileNav.jsx
│   │   └── OfflineBanner.jsx
│   ├── data-display/
│   │   ├── DataTable.jsx
│   │   ├── DataTableColumnHeader.jsx
│   │   ├── DataTablePagination.jsx
│   │   ├── DataTableToolbar.jsx
│   │   ├── DataTableBulkActions.jsx
│   │   ├── DataTableRowActions.jsx
│   │   ├── DataTableVirtualBody.jsx
│   │   ├── KPICard.jsx
│   │   ├── StatWidget.jsx
│   │   ├── ActivityFeed.jsx
│   │   ├── ActivityFeedItem.jsx
│   │   ├── StatusTimeline.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── AvatarGroup.jsx
│   │   ├── ChartContainer.jsx
│   │   ├── ChartTooltip.jsx
│   │   └── TrendIndicator.jsx
│   ├── data-entry/
│   │   ├── FormField.jsx
│   │   ├── FormLayout.jsx
│   │   ├── FormSection.jsx
│   │   ├── FormActions.jsx
│   │   ├── SearchSelect.jsx
│   │   ├── DateRangePicker.jsx
│   │   ├── DatePicker.jsx
│   │   ├── CurrencyInput.jsx
│   │   ├── GSTINInput.jsx
│   │   ├── PhoneInput.jsx
│   │   ├── PINInput.jsx
│   │   ├── FileUpload.jsx
│   │   ├── AddressInput.jsx
│   │   ├── Stepper.jsx
│   │   └── AutoSaveIndicator.jsx
│   ├── feedback/
│   │   ├── LoadingState.jsx
│   │   ├── TableSkeleton.jsx
│   │   ├── CardSkeleton.jsx
│   │   ├── PageSkeleton.jsx
│   │   ├── ErrorState.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ConfirmDialog.jsx
│   │   └── QueryErrorBoundary.jsx
│   ├── navigation/
│   │   ├── Breadcrumb.jsx
│   │   ├── Tabs.jsx
│   │   ├── TabList.jsx
│   │   ├── TabPanel.jsx
│   │   ├── Pagination.jsx
│   │   ├── FilterDrawer.jsx
│   │   ├── FilterChips.jsx
│   │   └── NavLink.jsx
│   ├── overlays/
│   │   ├── Drawer.jsx
│   │   ├── Modal.jsx
│   │   ├── ModalStack.jsx
│   │   ├── Popover.jsx
│   │   └── Tooltip.jsx
│   ├── motion/
│   │   ├── MotionPage.jsx
│   │   ├── MotionCard.jsx
│   │   ├── MotionList.jsx
│   │   ├── MotionFade.jsx
│   │   ├── MotionSlide.jsx
│   │   └── ReducedMotionProvider.jsx
│   └── error-boundaries/
│       ├── AppErrorBoundary.jsx
│       ├── RouteErrorBoundary.jsx
│       └── SectionErrorBoundary.jsx
│
├── features/
│   ├── command-palette/
│   │   ├── CommandPalette.jsx
│   │   ├── CommandPaletteTrigger.jsx
│   │   ├── CommandPaletteResults.jsx
│   │   ├── commandRegistry.js
│   │   └── index.js
│   ├── global-search/
│   │   ├── GlobalSearch.jsx
│   │   ├── GlobalSearchResults.jsx
│   │   ├── useGlobalSearch.js
│   │   └── index.js
│   ├── notifications/
│   │   ├── NotificationCenter.jsx
│   │   ├── NotificationToastBridge.jsx
│   │   └── index.js
│   ├── audit-log/
│   │   ├── AuditLogViewer.jsx
│   │   ├── AuditLogFilters.jsx
│   │   ├── useAuditLog.js
│   │   └── index.js
│   ├── export-engine/
│   │   ├── ExportDialog.jsx
│   │   ├── useExport.js
│   │   ├── exportFormats.js
│   │   └── index.js
│   ├── import-engine/
│   │   ├── ImportDialog.jsx
│   │   ├── ImportPreview.jsx
│   │   ├── useImport.js
│   │   └── index.js
│   ├── theme-switcher/
│   │   ├── ThemeSwitcher.jsx
│   │   ├── ThemeToggle.jsx
│   │   └── index.js
│   └── onboarding/
│       ├── OnboardingTour.jsx
│       ├── OnboardingStep.jsx
│       ├── useOnboarding.js
│       └── index.js
│
├── hooks/
│   ├── useAuth.js
│   ├── usePermission.js
│   ├── usePanel.js
│   ├── useMediaQuery.js
│   ├── useSidebar.js
│   ├── useKeyboard.js
│   ├── useDebounce.js
│   ├── useIntersection.js
│   ├── usePrevious.js
│   ├── useLocalStorage.js
│   ├── useClipboard.js
│   ├── useConfirmDialog.js
│   ├── useAutoSave.js
│   ├── useOnlineStatus.js
│   └── useDocumentTitle.js
│
├── store/
│   ├── auth.store.js
│   ├── session.store.js
│   ├── permission.store.js
│   ├── sidebar.store.js
│   ├── modal.store.js
│   ├── notification.store.js
│   ├── theme.store.js
│   ├── commandPalette.store.js
│   ├── filters.store.js
│   ├── draft.store.js
│   └── index.js
│
├── services/
│   ├── api/
│   │   ├── client.js
│   │   ├── interceptors.js
│   │   ├── queryKeys.js
│   │   ├── endpoints.js
│   │   └── retry.js
│   ├── inventory.service.js
│   ├── dispatch.service.js
│   ├── grn.service.js
│   ├── billing.service.js
│   ├── gst.service.js
│   ├── warranty.service.js
│   ├── complaints.service.js
│   ├── spares.service.js
│   ├── returns.service.js
│   ├── employees.service.js
│   ├── analytics.service.js
│   ├── notifications.service.js
│   ├── dealers.service.js
│   ├── warehouses.service.js
│   ├── auth.service.js
│   ├── audit.service.js
│   └── upload.service.js
│
├── queries/
│   ├── useInfiniteScroll.js
│   ├── usePaginatedQuery.js
│   └── useOptimisticMutation.js
│
├── providers/
│   ├── AuthProvider.jsx
│   ├── ThemeProvider.jsx
│   ├── PermissionProvider.jsx
│   ├── NotificationProvider.jsx
│   └── QueryProvider.jsx
│
├── contexts/
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   └── PermissionContext.js
│
├── validators/
│   ├── common.validators.js
│   ├── address.validators.js
│   └── document.validators.js
│
├── schemas/
│   ├── dealer.schema.js
│   ├── inventory.schema.js
│   ├── billing.schema.js
│   ├── complaint.schema.js
│   ├── employee.schema.js
│   ├── warehouse.schema.js
│   ├── dispatch.schema.js
│   ├── grn.schema.js
│   ├── warranty.schema.js
│   ├── returns.schema.js
│   └── auth.schema.js
│
├── constants/
│   ├── roles.js
│   ├── permissions.js
│   ├── status.js
│   ├── routes.js
│   └── messages.js
│
├── utils/
│   ├── format.js
│   ├── gst.js
│   ├── permissions.js
│   ├── pagination.js
│   ├── search.js
│   ├── export.js
│   ├── cn.js
│   ├── toast.js
│   ├── uuid.js
│   └── storage.js
│
├── animations/
│   ├── motion.config.js
│   ├── gsap.config.js
│   ├── page.transitions.js
│   └── micro.interactions.js
│
├── theme/
│   ├── tokens.js
│   ├── typography.js
│   └── shadows.js
│
├── styles/
│   ├── globals.css
│   ├── typography.css
│   └── animations.css
│
├── assets/
│   ├── images/
│   │   └── .gitkeep
│   ├── illustrations/
│   │   ├── empty-inventory.svg
│   │   ├── empty-billing.svg
│   │   ├── empty-complaints.svg
│   │   ├── empty-orders.svg
│   │   ├── empty-search.svg
│   │   ├── empty-team.svg
│   │   ├── error-network.svg
│   │   └── error-server.svg
│   ├── logos/
│   │   ├── logo-full.svg
│   │   ├── logo-mark.svg
│   │   └── logo-dark.svg
│   └── icons/
│       └── .gitkeep
│
└── types/
    ├── auth.types.js
    ├── inventory.types.js
    ├── billing.types.js
    ├── complaints.types.js
    ├── employees.types.js
    ├── analytics.types.js
    └── api.types.js
```

## Root-Level Project Files (outside `src/`)

```
/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── components.json          # shadcn/ui config
├── jsconfig.json            # path aliases (@/ → src/)
├── .env.example
├── .env.development
├── .env.production
├── .eslintrc.cjs
├── .prettierrc
├── package.json
└── public/
    ├── favicon.ico
    └── robots.txt
```

## Module Boundary Rules

| Rule | Enforcement |
|------|-------------|
| Modules never import from other modules | ESLint `no-restricted-imports` |
| Cross-module data sync | TanStack Query invalidation only |
| Cross-module UI composition | Happens in `pages/`, not in modules |
| Module public API | Only via `modules/[name]/index.js` |
| Pages import modules | Via `index.js` public API only |

## Path Aliases (`jsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
