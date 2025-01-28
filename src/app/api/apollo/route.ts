import { NextRequest, NextResponse } from "next/server";

const apiKey = String(process.env.APOLLO_API_KEY);

async function fetchPeople(personData: {
  email: string | string[] | undefined;
  linkedin_url: string | string[] | undefined;
}) {
  const baseUrl = "https://api.apollo.io/api/v1/people/match";
  const queryParams: {
    [key: string]: string | boolean | string[] | undefined;
  } = {
    ...personData,
    reveal_personal_emails: false,
    reveal_phone_number: false,
    webhook_url:
      "https://hooks.airtable.com/workflows/v1/genericWebhook/app8pU6C1zocQzLis/wflTjc22YdhjIkgpS/wtrl8igFJnBf1Lwuy",
  };

  const url =
    baseUrl +
    "?" +
    Object.keys(queryParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key] as string)}`
      )
      .join("&");

  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching people:", error.message);
    throw new Error(`Failed to fetch people: ${error.message}`);
  }
}

async function fetchCompany(domain: string) {
  const url = `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(
    domain
  )}`;

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching company:", error.message);
    throw new Error(`Failed to fetch company data: ${error.message}`);
  }
}

export const GET = async (req: Request) => {
  const reqUrl = new URL(req.url);
  const searchParams = reqUrl.searchParams;
  const type = searchParams.get("type");
  const email = searchParams.get("email");
  const linkedin_url = searchParams.get("linkedin_url");
  const domain = searchParams.get("domain");

  try {
    if (type === "people") {
      const response = await fetchPeople({
        email: email || undefined,
        linkedin_url: linkedin_url || undefined,
      });
      return NextResponse.json(response, { status: 200 });
    }

    if (type === "company") {
      if (!domain) {
        return NextResponse.json(
          { error: "Domain is required for company lookup" },
          { status: 400 }
        );
      }
      const response = await fetchCompany(domain as string);
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid type. Must be 'people' or 'company'." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
