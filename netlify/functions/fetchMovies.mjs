export default async (req, context) => {
    const { query } = context.params
    const res = await fetch(`http://www.omdbapi.com/?apikey=${process.env.API_TOKEN}&s=${query}`)
    const movies = await res.json()
    return new Response(JSON.stringify(movies))
}

export const config = {
    path: "/api/search/:query"
}