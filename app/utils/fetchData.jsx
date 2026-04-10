import { notFound } from "next/navigation";

export const fetchData = async (url) => {
  try {
    // console.log(url);
    const response = await fetch(url, {next: {revalidate: 3600}}); 
    if (!response.ok) notFound();

    const data = await response.json();
    if (!data || (Array.isArray(data) && data.length === 0)) notFound();

    return data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    notFound();
  }
};

export const fetchData1 = async (url) => {
  try {
    const response = await fetch(url, {next: {revalidate: 3600*24*5}}); 
    if (!response.ok) notFound();

    const data = await response.json();
    if (!data || (Array.isArray(data) && data.length === 0)) notFound();

    return data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    notFound();
  }
};
