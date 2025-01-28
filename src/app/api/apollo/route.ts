import type { NextApiRequest, NextApiResponse } from "next";

const apiKey = "eziAc9aC7tPXuf2Ki7I0kQ";



async function fetchPeople(personData: { email: string | string[] | undefined; linkedin_url: string | string[] | undefined; }) {
  const baseUrl = "https://api.apollo.io/api/v1/people/match";
  const queryParams: { [key: string]: string | boolean | string[] | undefined } = {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { type, email, linkedin_url, domain } = req.query;

  try {
    if (type === "people") {
      const response = await fetchPeople({
        email: email || undefined,
        linkedin_url: linkedin_url || undefined,
      });
      return res.status(200).json(response);
    }

    if (type === "company") {
      if (!domain) {
        return res
          .status(400)
          .json({ error: "Domain is required for company lookup" });
      }
      const response = await fetchCompany(domain as string);
      return res.status(200).json(response);
    }

    return res
      .status(400)
      .json({ error: "Invalid type. Must be 'people' or 'company'." });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
