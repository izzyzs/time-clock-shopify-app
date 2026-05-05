import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useRevalidator, useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  employeeRowToState,
  Tab,
  TimeEntry,
  Employee,
  timeEntryRowToState,
} from "app/types";
import { createClient } from "app/utils/supabase.server";
import { Database } from "app/utils/database.types";
import ClockInOutTab from "../components/ClockInOutTab";
// import DashboardTab from "../components/DashboardTab";
// import TimeLogTab from "../components/TimeLogTab";
// import ReportsTab from "../components/ReportsTab";
import EmployeesTab from "../components/EmployeesTab";
import DashboardTab from "app/components/DashboardTab";
import TimeLogTab from "app/components/TimeLogTab";
import ReportsTab from "app/components/ReportsTab";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log(`running loader`);
  const { session } = await authenticate.admin(request);
  const { supabase } = createClient(request);
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("shop", session.shop);
  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*")
    .eq("shop", session.shop);

  return {
    employees: employees?.map((e) => employeeRowToState(e)),
    timeEntries: timeEntries?.map((t) => timeEntryRowToState(t)),
  };

  // return null;
};

// export const action = async ({ request }: ActionFunctionArgs) => {
//   const { admin } = await authenticate.admin(request);
//   const color = ["Red", "Orange", "Yellow", "Green"][
//     Math.floor(Math.random() * 4)
//   ];
//   const response = await admin.graphql(
//     `#graphql
//       mutation populateProduct($product: ProductCreateInput!) {
//         productCreate(product: $product) {
//           product {
//             id
//             title
//             handle
//             status
//             variants(first: 10) {
//               edges {
//                 node {
//                   id
//                   price
//                   barcode
//                   createdAt
//                 }
//               }
//             }
//             demoInfo: metafield(namespace: "$app", key: "demo_info") {
//               jsonValue
//             }
//           }
//         }
//       }`,
//     {
//       variables: {
//         product: {
//           title: `${color} Snowboard`,
//           metafields: [
//             {
//               namespace: "$app",
//               key: "demo_info",
//               value: "Created by React Router Template",
//             },
//           ],
//         },
//       },
//     },
//   );
//   const responseJson = await response.json();

//   const product = responseJson.data!.productCreate!.product!;
//   const variantId = product.variants.edges[0]!.node!.id!;

//   const variantResponse = await admin.graphql(
//     `#graphql
//     mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
//       productVariantsBulkUpdate(productId: $productId, variants: $variants) {
//         productVariants {
//           id
//           price
//           barcode
//           createdAt
//         }
//       }
//     }`,
//     {
//       variables: {
//         productId: product.id,
//         variants: [{ id: variantId, price: "100.00" }],
//       },
//     },
//   );

//   const variantResponseJson = await variantResponse.json();

//   const metaobjectResponse = await admin.graphql(
//     `#graphql
//     mutation shopifyReactRouterTemplateUpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
//       metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
//         metaobject {
//           id
//           handle
//           title: field(key: "title") {
//             jsonValue
//           }
//           description: field(key: "description") {
//             jsonValue
//           }
//         }
//         userErrors {
//           field
//           message
//         }
//       }
//     }`,
//     {
//       variables: {
//         handle: {
//           type: "$app:example",
//           handle: "demo-entry",
//         },
//         metaobject: {
//           fields: [
//             { key: "title", value: "Demo Entry" },
//             {
//               key: "description",
//               value:
//                 "This metaobject was created by the Shopify app template to demonstrate the metaobject API.",
//             },
//           ],
//         },
//       },
//     },
//   );

//   const metaobjectResponseJson = await metaobjectResponse.json();

//   return {
//     product: responseJson!.data!.productCreate!.product,
//     variant:
//       variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
//     metaobject: metaobjectResponseJson!.data!.metaobjectUpsert!.metaobject,
//   };
// };

export default function Index() {
  // const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();
  const [activeTab, setActiveTab] = useState<Tab>("clockinout");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const data = useLoaderData<typeof loader>();
  const loadAllData = () => revalidator.revalidate();
  const shopify = useAppBridge();
  const dataLoading = revalidator.state === "loading";

  // useEffect(() => {
  //   if (fetcher.data?.product?.id) {
  //     shopify.toast.show("Product created");
  //   }
  // }, [fetcher.data?.product?.id, shopify]);

  // const generateProduct = () => fetcher.submit({}, { method: "POST" });

  useEffect(() => {
    setEmployees(data.employees ?? []);
    setTimeEntries(data.timeEntries ?? []);
  }, [data]);

  return (
    <s-page heading="Shopify app template">
      <s-section>
        <s-stack direction="inline" gap="base">
          <s-clickable-chip
            color={activeTab === "clockinout" ? "strong" : "subdued"}
            onClick={() => setActiveTab("clockinout")}
            accessibilityLabel="Clock In / Out tab"
          >
            Clock In / Out
          </s-clickable-chip>
          <s-clickable-chip
            color={activeTab === "dashboard" ? "strong" : "subdued"}
            onClick={() => setActiveTab("dashboard")}
            accessibilityLabel="Live Dashboard tab"
          >
            Live Dashboard
          </s-clickable-chip>
          <s-clickable-chip
            color={activeTab === "timelog" ? "strong" : "subdued"}
            onClick={() => setActiveTab("timelog")}
            accessibilityLabel="Time Log tab"
          >
            Time Log
          </s-clickable-chip>
          <s-clickable-chip
            color={activeTab === "reports" ? "strong" : "subdued"}
            onClick={() => setActiveTab("reports")}
            accessibilityLabel="Reports tab"
          >
            Reports
          </s-clickable-chip>
          <s-clickable-chip
            color={activeTab === "employees" ? "strong" : "subdued"}
            onClick={() => setActiveTab("employees")}
            accessibilityLabel="Employees tab"
          >
            Employees
          </s-clickable-chip>
        </s-stack>
      </s-section>
      {activeTab === "clockinout" && (
        <ClockInOutTab
          employees={employees}
          timeEntries={timeEntries}
          loading={dataLoading}
          onRefresh={loadAllData}
        />
      )}
      {activeTab === "dashboard" && (
        <DashboardTab
          employees={employees}
          timeEntries={timeEntries}
          loading={dataLoading}
          onRefresh={loadAllData}
        />
      )}
      {activeTab === "timelog" && (
        <TimeLogTab
          employees={employees}
          timeEntries={timeEntries}
          loading={dataLoading}
          onRefresh={loadAllData}
        />
      )}
      {activeTab === "reports" && (
        <ReportsTab
          employees={employees}
          timeEntries={timeEntries}
          loading={dataLoading}
          onRefresh={loadAllData}
        />
      )}
      {activeTab === "employees" && (
        <EmployeesTab
          employees={employees}
          loading={dataLoading}
          onRefresh={loadAllData}
        />
      )}
      {/* <s-section heading="Congrats on creating a new Shopify app 🎉">
        <s-paragraph>
          This embedded app template uses{" "}
          <s-link
            href="https://shopify.dev/docs/apps/tools/app-bridge"
            target="_blank"
          >
            App Bridge
          </s-link>{" "}
          interface examples like an{" "}
          <s-link href="/app/additional">additional page in the app nav</s-link>
          , as well as an{" "}
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            Admin GraphQL
          </s-link>{" "}
          mutation demo, to provide a starting point for app development.
        </s-paragraph>
      </s-section>
      <s-section heading="Get started with products">
        <s-paragraph>
          Generate a product with GraphQL and get the JSON output for that
          product. Learn more about the{" "}
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
            target="_blank"
          >
            productCreate
          </s-link>{" "}
          mutation in our API references. Includes a product{" "}
          <s-link
            href="https://shopify.dev/docs/apps/build/custom-data/metafields"
            target="_blank"
          >
            metafield
          </s-link>{" "}
          and{" "}
          <s-link
            href="https://shopify.dev/docs/apps/build/custom-data/metaobjects"
            target="_blank"
          >
            metaobject
          </s-link>
          .
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-button
            onClick={generateProduct}
            {...(isLoading ? { loading: true } : {})}
          >
            Generate a product
          </s-button>
          {fetcher.data?.product && (
            <s-button
              onClick={() => {
                shopify.intents.invoke?.("edit:shopify/Product", {
                  value: fetcher.data?.product?.id,
                });
              }}
              target="_blank"
              variant="tertiary"
            >
              Edit product
            </s-button>
          )}
        </s-stack>
        {fetcher.data?.product && (
          <s-section heading="productCreate mutation">
            <s-stack direction="block" gap="base">
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>{JSON.stringify(fetcher.data.product, null, 2)}</code>
                </pre>
              </s-box>

              <s-heading>productVariantsBulkUpdate mutation</s-heading>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>{JSON.stringify(fetcher.data.variant, null, 2)}</code>
                </pre>
              </s-box>

              <s-heading>metaobjectUpsert mutation</s-heading>
              <s-box
                padding="base"
                borderWidth="base"
                borderRadius="base"
                background="subdued"
              >
                <pre style={{ margin: 0 }}>
                  <code>
                    {JSON.stringify(fetcher.data.metaobject, null, 2)}
                  </code>
                </pre>
              </s-box>
            </s-stack>
          </s-section>
        )}
      </s-section> */}

      {/* <s-section slot="aside" heading="App template specs">
        <s-paragraph>
          <s-text>Framework: </s-text>
          <s-link href="https://reactrouter.com/" target="_blank">
            React Router
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Interface: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/app-home/using-polaris-components"
            target="_blank"
          >
            Polaris web components
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>API: </s-text>
          <s-link
            href="https://shopify.dev/docs/api/admin-graphql"
            target="_blank"
          >
            GraphQL
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Custom data: </s-text>
          <s-link
            href="https://shopify.dev/docs/apps/build/custom-data"
            target="_blank"
          >
            Metafields &amp; metaobjects
          </s-link>
        </s-paragraph>
        <s-paragraph>
          <s-text>Database: </s-text>
          <s-link href="https://www.prisma.io/" target="_blank">
            Prisma
          </s-link>
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Next steps">
        <s-unordered-list>
          <s-list-item>
            Build an{" "}
            <s-link
              href="https://shopify.dev/docs/apps/getting-started/build-app-example"
              target="_blank"
            >
              example app
            </s-link>
          </s-list-item>
          <s-list-item>
            Explore Shopify&apos;s API with{" "}
            <s-link
              href="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
              target="_blank"
            >
              GraphiQL
            </s-link>
          </s-list-item>
        </s-unordered-list>
      </s-section> */}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
