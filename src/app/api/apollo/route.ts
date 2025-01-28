export const GET = async (req: Request) => {
    const reqUrl = new URL(req.url);
    const searchParams = reqUrl.searchParams;

    return new Response("Hello world!")

   
    
}