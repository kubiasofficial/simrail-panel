// api/get-train-data.js
// Tato funkce bude stahovat a zpracovávat data o vlacích z externího SimRail API.

export default async function handler(request, response) {
  // Logování pro diagnostiku spuštění funkce
  console.log('Vercel Function: get-train-data.js started.');
  console.log('Request method:', request.method);

  if (request.method !== 'GET') {
    console.log('Method Not Allowed: Only GET requests are supported for get-train-data.');
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { serverCode } = request.query; // Získá kód serveru z URL parametru
  if (!serverCode) {
    console.error('ERROR: Missing serverCode parameter for get-train-data.');
    return response.status(400).json({ message: 'Chybí parametr serverCode.' });
  }

  const externalApiUrl = `https://panel.simrail.eu:8084/trains-open?serverCode=${serverCode}`;
  console.log(`Attempting to fetch train data from external API: ${externalApiUrl}`);

  try {
    const externalApiResponse = await fetch(externalApiUrl);
    console.log(`Received response from external API. Status: ${externalApiResponse.status} ${externalApiResponse.statusText}`);

    if (!externalApiResponse.ok) {
      const errorText = await externalApiResponse.text();
      console.error(`ERROR: External API returned non-OK status ${externalApiResponse.status} for ${serverCode}. Full response: ${errorText}`);
      // Pokusíme se parsovat jako JSON, pokud to selže, vrátíme raw text
      try {
        const errorJson = JSON.parse(errorText);
        return response.status(externalApiResponse.status).json({
          message: `Chyba při načítání dat z externího API pro server ${serverCode}.`,
          externalError: errorJson
        });
      } catch (e) {
        return response.status(externalApiResponse.status).json({
          message: `Chyba při načítání dat z externího API pro server ${serverCode}.`,
          externalError: errorText
        });
      }
    }

    const externalData = await externalApiResponse.json();
    console.log(`Successfully received ${externalData.length} trains from external API for ${serverCode}.`);

    // Transformace dat z externího API do formátu, který očekává frontend
    const transformedTrains = externalData.map(train => ({
      Number: train.trainNo || 'N/A',
      Vehicle: train.locoType || 'N/A',
      DepartureTime: train.departureTime || 'N/A', // Používáme DepartureTime
      DepartureStation: train.departureStation || 'N/A',
      ArrivalTime: train.arrivalTime || 'N/A',
      ArrivalStation: train.arrivalStation || 'N/A',
      Length: train.length || 'N/A',
      Weight: train.weight || 'N/A',
      DLC: train.dlc || 'N/A'
    }));

    console.log(`Transformed ${transformedTrains.length} trains for frontend.`);
    response.status(200).json({ trains: transformedTrains });

  } catch (error) {
    console.error('SERVER ERROR: Error fetching or processing external API data:', error);
    response.status(500).json({
      message: 'Interní chyba serveru při načítání dat o vlacích. Zkontrolujte Vercel logy pro více detailů.',
      error: error.message,
      stack: error.stack
    });
  }
}
