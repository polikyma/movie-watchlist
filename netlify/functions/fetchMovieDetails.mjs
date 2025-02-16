export default async (req, context) => {
    const { id } = context.params
    const res = await fetch(
                `http://www.omdbapi.com/?apikey=${process.env.API_TOKEN}&i=${id}&plot=full`
                )
    const movieDetails = await res.json()
    return new Response(JSON.stringify(movieDetails))
}

export const config = {
    path: "/api/details/:id"
}