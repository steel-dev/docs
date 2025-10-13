#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import yaml from 'js-yaml';
import stringify from 'json-stringify-safe';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { OpenAPIMarkdownGenerator } from './openapi-to-markdown.mts';
import { buildEndpointMappings, saveMappings } from './utils/api-endpoint-mapping.mts';

interface ApiSpec {
  name: string;
  url: string;
}

interface GitHubApiSpec {
  name: string;
  type: 'github';
  repo: string;
  branch: string;
  filePath: string;
}

async function generatePlatformApiSpec(): Promise<void> {
  try {
    const openApiDir = path.join(process.cwd(), 'openapi');
    await fs.mkdir(openApiDir, { recursive: true });

    const platformApiPath = path.join(openApiDir, 'platform-api.json');

    // Check if file already exists (skip if it does)
    try {
      await fs.access(platformApiPath);
      return;
    } catch {
      // File doesn't exist, generate it
      console.log('Generating platform-api.json...');
    }

    // Hardcoded Platform API spec - copied from existing platform-api.json
    const platformApiSpec = {
      openapi: '3.0.3',
      info: {
        title: 'Steel API',
        contact: {
          name: 'Steel Team',
          email: 'team@steel.dev',
        },
        description:
          'Steel (https://steel.dev) is an open-source browser API purpose-built for AI agents.\n        \nIt offers endpoints for various browser actions and session management, enabling agents to navigate the web for information over long running browser sessions.\n    \n**Key Capabilities:**\n- Control fleets of browser sessions in the cloud via API or Python/Node SDKs\n- Easily extract page data as cleaned HTML, markdown, PDFs, or screenshots\n- Access data behind logins with persistent cookies and automatic sign-in\n- Render complex client-side content with JavaScript execution\n- Bypass anti-bot measures with rotating proxies, stealth configs, and CAPTCHA solving\n- Reduce token usage and costs by up to 80% with optimized page formats\n- Reuse session and cookie data across multiple runs\n- Debug with ease using live session viewers, replays, and embeddings\n\n**Target Audience:**\n- AI engineers and developers working with online LLMs\n- Users with their own infrastructure looking to offload browser hosting operations\n- Users who need to scrape the web for information\n- QA teams who need to test web applications\n\n**Get Started:**\n- Open-source: Available as a Docker container for easy integration and scaling\n- Cloud API: Fully hosted and managed, no setup required. Get an API key at https://steel.dev\n- SDK: Available in Python, JavaScript, and more\n\n**Documentation:**\n- Check out the full documentation at https://docs.steel.dev\n- Explore the SDK documentation to get started with your project\n- Join our community on Discord for support and discussions',
        version: '0.0.1',
      },
      components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'steel-api-key',
            in: 'header',
          },
        },
        schemas: {
          CreateAPIKeyRequest: {
            title: 'createAPIKeyRequest',
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
          UpdateAPIKeyRequest: {
            title: 'updateAPIKeyRequest',
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
          ApiKeysResponse: {
            title: 'apiKeysResponse',
            type: 'object',
            properties: {
              apiKeys: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    key: {
                      type: 'string',
                    },
                    name: {
                      type: 'string',
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                    },
                    updatedAt: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                  required: ['id', 'key', 'createdAt', 'updatedAt'],
                  additionalProperties: false,
                },
              },
            },
            required: ['apiKeys'],
            additionalProperties: false,
          },
          ApiKeyResponse: {
            title: 'apiKeyResponse',
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
              key: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
            },
            required: ['id', 'key', 'createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          DeleteAPIKeyResponse: {
            title: 'deleteAPIKeyResponse',
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
            },
            required: ['success'],
            additionalProperties: false,
          },
          ErrorResponse: {
            title: 'errorResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
              error: {
                type: 'string',
              },
              context: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    keyword: {
                      type: 'string',
                    },
                    params: {},
                    message: {
                      type: 'string',
                    },
                  },
                  required: ['keyword', 'message'],
                  additionalProperties: false,
                },
              },
            },
            required: ['message'],
            additionalProperties: false,
            description: 'An error response from the API',
          },
          HeaderSchema: {
            title: 'headerSchema',
            type: 'object',
            properties: {
              'org-id': {
                type: 'string',
                format: 'uuid',
              },
              'Next-Cursor': {
                type: 'string',
                pattern: '^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$',
              },
            },
            required: ['org-id'],
            additionalProperties: false,
          },
          HeaderSdkSchema: {
            title: 'headerSdkSchema',
            type: 'object',
            properties: {
              'steel-api-key': {
                type: 'string',
              },
            },
            required: ['steel-api-key'],
            additionalProperties: false,
            description: 'API key for authentication',
          },
          OrgWithSessionIdHeaderSchema: {
            title: 'orgWithSessionIdHeaderSchema',
            type: 'object',
            properties: {
              'org-id': {
                type: 'string',
                format: 'uuid',
              },
              'session-id': {
                type: 'string',
                format: 'uuid',
              },
            },
            required: ['org-id', 'session-id'],
            additionalProperties: false,
          },
          IdParam: {
            title: 'idParam',
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
            },
            required: ['id'],
            additionalProperties: false,
            description: 'Unique identifier for a resource',
          },
          User: {
            title: 'user',
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                format: 'uuid',
              },
            },
            required: ['userId'],
            additionalProperties: false,
          },
          ApiKeyHeaders: {
            title: 'apiKeyHeaders',
            type: 'object',
            properties: {
              apiKeyUsed: {
                type: 'string',
              },
            },
            required: ['apiKeyUsed'],
            additionalProperties: false,
          },
          SuccessResponse: {
            title: 'successResponse',
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
            },
            required: ['success'],
            additionalProperties: false,
          },
          SessionsQuery: {
            title: 'sessionsQuery',
            type: 'object',
            properties: {
              cursorId: {
                type: 'string',
                description: 'Cursor ID for pagination',
              },
              limit: {
                type: 'integer',
                description: 'Number of sessions to return. Default is 50.',
              },
              status: {
                type: 'string',
                enum: ['live', 'released', 'failed'],
                description: 'Filter sessions by current status',
              },
            },
            additionalProperties: false,
          },
          CreateSessionRequest: {
            title: 'createSessionRequest',
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                format: 'uuid',
                description: 'Optional custom UUID for the session',
              },
              userAgent: {
                type: 'string',
                description: 'Custom user agent string for the browser session',
              },
              useProxy: {
                anyOf: [
                  {
                    anyOf: [
                      {
                        not: {},
                      },
                      {
                        anyOf: [
                          {
                            type: 'boolean',
                            description: 'Simple boolean to enable/disable Steel proxies',
                          },
                          {
                            anyOf: [
                              {
                                type: 'object',
                                properties: {
                                  geolocation: {
                                    type: 'object',
                                    properties: {
                                      city: {
                                        type: 'string',
                                        enum: [
                                          'A_CORUNA',
                                          'ABIDJAN',
                                          'ABU_DHABI',
                                          'ABUJA',
                                          'ACAPULCO_DE JUAREZ',
                                          'ACCRA',
                                          'ADANA',
                                          'ADAPAZARI',
                                          'ADDIS_ABABA',
                                          'ADELAIDE',
                                          'AFYONKARAHISAR',
                                          'AGADIR',
                                          'AGUAS_LINDAS DE GOIAS',
                                          'AGUASCALIENTES',
                                          'AHMEDABAD',
                                          'AIZAWL',
                                          'AJMAN',
                                          'AKRON',
                                          'AKSARAY',
                                          'AL_AIN CITY',
                                          'AL_MANSURAH',
                                          'AL_QATIF',
                                          'ALAJUELA',
                                          'ALBANY',
                                          'ALBUQUERQUE',
                                          'ALEXANDRIA',
                                          'ALGIERS',
                                          'ALICANTE',
                                          'ALMADA',
                                          'ALMATY',
                                          'ALMERE_STAD',
                                          'ALVORADA',
                                          'AMADORA',
                                          'AMASYA',
                                          'AMBATO',
                                          'AMERICANA',
                                          'AMMAN',
                                          'AMSTERDAM',
                                          'ANANINDEUA',
                                          'ANAPOLIS',
                                          'ANGELES_CITY',
                                          'ANGERS',
                                          'ANGRA_DOS REIS',
                                          'ANKARA',
                                          'ANTAKYA',
                                          'ANTALYA',
                                          'ANTANANARIVO',
                                          'ANTIPOLO_CITY',
                                          'ANTOFAGASTA',
                                          'ANTWERP',
                                          'APARECIDA_DE GOIANIA',
                                          'APODACA',
                                          'ARACAJU',
                                          'ARACATUBA',
                                          'ARAD',
                                          'ARAGUAINA',
                                          'ARAPIRACA',
                                          'ARARAQUARA',
                                          'AREQUIPA',
                                          'ARICA',
                                          'ARLINGTON',
                                          'ARYANAH',
                                          'ASTANA',
                                          'ASUNCION',
                                          'ASYUT',
                                          'ATAKUM',
                                          'ATHENS',
                                          'ATIBAIA',
                                          'ATLANTA',
                                          'AUBURN',
                                          'AUCKLAND',
                                          'AURORA',
                                          'AUSTIN',
                                          'AVELLANEDA',
                                          'AYDIN',
                                          'AZCAPOTZALCO',
                                          'BACOLOD_CITY',
                                          'BACOOR',
                                          'BAGHDAD',
                                          'BAGUIO_CITY',
                                          'BAHIA_BLANCA',
                                          'BAKERSFIELD',
                                          'BAKU',
                                          'BALIKESIR',
                                          'BALIKPAPAN',
                                          'BALNEARIO_CAMBORIU',
                                          'BALTIMORE',
                                          'BANDAR_LAMPUNG',
                                          'BANDAR_SERI BEGAWAN',
                                          'BANDUNG',
                                          'BANGKOK',
                                          'BANJA_LUKA',
                                          'BANJARMASIN',
                                          'BARCELONA',
                                          'BARI',
                                          'BARQUISIMETO',
                                          'BARRA_MANSA',
                                          'BARRANQUILLA',
                                          'BARUERI',
                                          'BATAM',
                                          'BATANGAS',
                                          'BATMAN',
                                          'BATNA_CITY',
                                          'BATON_ROUGE',
                                          'BATUMI',
                                          'BAURU',
                                          'BEIRUT',
                                          'BEJAIA',
                                          'BEKASI',
                                          'BELEM',
                                          'BELFAST',
                                          'BELFORD_ROXO',
                                          'BELGRADE',
                                          'BELO_HORIZONTE',
                                          'BENGALURU',
                                          'BENI_MELLAL',
                                          'BERAZATEGUI',
                                          'BERN',
                                          'BETIM',
                                          'BHARATPUR',
                                          'BHOPAL',
                                          'BHUBANESWAR',
                                          'BIALYSTOK',
                                          'BIEN_HOA',
                                          'BILBAO',
                                          'BILECIK',
                                          'BIRATNAGAR',
                                          'BIRMINGHAM',
                                          'BISHKEK',
                                          'BIZERTE',
                                          'BLIDA',
                                          'BLOEMFONTEIN',
                                          'BLOOMINGTON',
                                          'BLUMENAU',
                                          'BOA_VISTA',
                                          'BOCHUM',
                                          'BOGOR',
                                          'BOGOTA',
                                          'BOISE',
                                          'BOKSBURG',
                                          'BOLOGNA',
                                          'BOLU',
                                          'BORDEAUX',
                                          'BOSTON',
                                          'BOTUCATU',
                                          'BRADFORD',
                                          'BRAGA',
                                          'BRAGANCA_PAULISTA',
                                          'BRAMPTON',
                                          'BRASILIA',
                                          'BRASOV',
                                          'BRATISLAVA',
                                          'BREMEN',
                                          'BRESCIA',
                                          'BREST',
                                          'BRIDGETOWN',
                                          'BRISBANE',
                                          'BRISTOL',
                                          'BRNO',
                                          'BROOKLYN',
                                          'BRUSSELS',
                                          'BUCARAMANGA',
                                          'BUCHAREST',
                                          'BUDAPEST',
                                          'BUENOS_AIRES',
                                          'BUFFALO',
                                          'BUK_GU',
                                          'BUKHARA',
                                          'BURGAS',
                                          'BURNABY',
                                          'BURSA',
                                          'BUTUAN',
                                          'BYDGOSZCZ',
                                          'CABANATUAN_CITY',
                                          'CABO_FRIO',
                                          'CABUYAO',
                                          'CACHOEIRO_DE ITAPEMIRIM',
                                          'CAGAYAN_DE ORO',
                                          'CAGLIARI',
                                          'CAIRO',
                                          'CALAMBA',
                                          'CALGARY',
                                          'CALOOCAN_CITY',
                                          'CAMACARI',
                                          'CAMARAGIBE',
                                          'CAMPECHE',
                                          'CAMPINA_GRANDE',
                                          'CAMPINAS',
                                          'CAMPO_GRANDE',
                                          'CAMPO_LARGO',
                                          'CAMPOS_DOS GOYTACAZES',
                                          'CAN_THO',
                                          'CANOAS',
                                          'CANTON',
                                          'CAPE_TOWN',
                                          'CARACAS',
                                          'CARAGUATATUBA',
                                          'CARAPICUIBA',
                                          'CARDIFF',
                                          'CARIACICA',
                                          'CARMONA',
                                          'CARTAGENA',
                                          'CARUARU',
                                          'CASABLANCA',
                                          'CASCAVEL',
                                          'CASEROS',
                                          'CASTANHAL',
                                          'CASTRIES',
                                          'CATALAO',
                                          'CATAMARCA',
                                          'CATANDUVA',
                                          'CATANIA',
                                          'CAUCAIA',
                                          'CAXIAS_DO SUL',
                                          'CEBU_CITY',
                                          'CENTRAL',
                                          'CENTRO',
                                          'CENTURION',
                                          'CHAGUANAS',
                                          'CHANDIGARH',
                                          'CHANDLER',
                                          'CHANG_HUA',
                                          'CHAPECO',
                                          'CHARLESTON',
                                          'CHARLOTTE',
                                          'CHELYABINSK',
                                          'CHENNAI',
                                          'CHERKASY',
                                          'CHERNIVTSI',
                                          'CHIA',
                                          'CHIANG_MAI',
                                          'CHICLAYO',
                                          'CHIHUAHUA_CITY',
                                          'CHIMBOTE',
                                          'CHISINAU',
                                          'CHITTAGONG',
                                          'CHRISTCHURCH',
                                          'CINCINNATI',
                                          'CIREBON',
                                          'CITY_OF MUNTINLUPA',
                                          'CIUDAD_DEL ESTE',
                                          'CIUDAD_GUAYANA',
                                          'CIUDAD_JUAREZ',
                                          'CIUDAD_NEZAHUALCOYOTL',
                                          'CIUDAD_OBREGON',
                                          'CLEVELAND',
                                          'CLUJ_NAPOCA',
                                          'COCHABAMBA',
                                          'COIMBATORE',
                                          'COIMBRA',
                                          'COLOGNE',
                                          'COLOMBO',
                                          'COLORADO_SPRINGS',
                                          'COLUMBIA',
                                          'COLUMBUS',
                                          'COMODORO_RIVADAVIA',
                                          'CONCEPCION',
                                          'CONCORD',
                                          'CONSTANTA',
                                          'CONSTANTINE',
                                          'CONTAGEM',
                                          'COPENHAGEN',
                                          'CORDOBA',
                                          'CORRIENTES',
                                          'CORUM',
                                          'COTIA',
                                          'COVENTRY',
                                          'CRAIOVA',
                                          'CRICIUMA',
                                          'CROYDON',
                                          'CUAUTITLAN_IZCALLI',
                                          'CUCUTA',
                                          'CUENCA',
                                          'CUERNAVACA',
                                          'CUIABA',
                                          'CULIACAN',
                                          'CURITIBA',
                                          'CUSCO',
                                          'DA_NANG',
                                          'DAGUPAN',
                                          'DAKAR',
                                          'DALLAS',
                                          'DAMIETTA',
                                          'DAMMAM',
                                          'DAR_ES SALAAM',
                                          'DASMARINAS',
                                          'DAVAO_CITY',
                                          'DAYTON',
                                          'DEBRECEN',
                                          'DECATUR',
                                          'DEHRADUN',
                                          'DELHI',
                                          'DENIZLI',
                                          'DENPASAR',
                                          'DENVER',
                                          'DEPOK',
                                          'DERBY',
                                          'DETROIT',
                                          'DHAKA',
                                          'DIADEMA',
                                          'DIVINOPOLIS',
                                          'DIYARBAKIR',
                                          'DJELFA',
                                          'DNIPRO',
                                          'DOHA',
                                          'DORTMUND',
                                          'DOURADOS',
                                          'DRESDEN',
                                          'DUBAI',
                                          'DUBLIN',
                                          'DUEZCE',
                                          'DUISBURG',
                                          'DUQUE_DE CAXIAS',
                                          'DURANGO',
                                          'DURBAN',
                                          'DUSSELDORF',
                                          'ECATEPEC',
                                          'EDINBURGH',
                                          'EDIRNE',
                                          'EDMONTON',
                                          'EL_JADIDA',
                                          'EL_PASO',
                                          'ELAZIG',
                                          'EMBU',
                                          'ENSENADA',
                                          'ERBIL',
                                          'ERZURUM',
                                          'ESKISEHIR',
                                          'ESPOO',
                                          'ESSEN',
                                          'FAISALABAD',
                                          'FAYETTEVILLE',
                                          'FAZENDA_RIO GRANDE',
                                          'FEIRA_DE SANTANA',
                                          'FES',
                                          'FLORENCE',
                                          'FLORENCIO_VARELA',
                                          'FLORIANOPOLIS',
                                          'FONTANA',
                                          'FORMOSA',
                                          'FORT_LAUDERDALE',
                                          'FORT_WAYNE',
                                          'FORT_WORTH',
                                          'FORTALEZA',
                                          'FOZ_DO IGUACU',
                                          'FRANCA',
                                          'FRANCISCO_MORATO',
                                          'FRANCO_DA ROCHA',
                                          'FRANKFURT_AM MAIN',
                                          'FREDERICKSBURG',
                                          'FRESNO',
                                          'FUNCHAL',
                                          'GABORONE',
                                          'GAINESVILLE',
                                          'GALATI',
                                          'GANGNAM_GU',
                                          'GARANHUNS',
                                          'GATINEAU',
                                          'GAZIANTEP',
                                          'GDANSK',
                                          'GDYNIA',
                                          'GENERAL_TRIAS',
                                          'GENEVA',
                                          'GENOA',
                                          'GEORGE_TOWN',
                                          'GEORGETOWN',
                                          'GHAZIABAD',
                                          'GHENT',
                                          'GIJON',
                                          'GIRESUN',
                                          'GIZA',
                                          'GLASGOW',
                                          'GLENDALE',
                                          'GLIWICE',
                                          'GOIANIA',
                                          'GOMEL',
                                          'GOTHENBURG',
                                          'GOVERNADOR_VALADARES',
                                          'GOYANG_SI',
                                          'GRANADA',
                                          'GRAND_RAPIDS',
                                          'GRAVATAI',
                                          'GRAZ',
                                          'GREENSBORO',
                                          'GREENVILLE',
                                          'GUADALAJARA',
                                          'GUADALUPE',
                                          'GUANGZHOU',
                                          'GUARAPUAVA',
                                          'GUARATINGUETA',
                                          'GUARUJA',
                                          'GUARULHOS',
                                          'GUATEMALA_CITY',
                                          'GUAYAQUIL',
                                          'GUJRANWALA',
                                          'GURUGRAM',
                                          'GUSTAVO_ADOLFO MADERO',
                                          'GUWAHATI',
                                          'GWANAK_GU',
                                          'HACKNEY',
                                          'HAIFA',
                                          'HAIPHONG',
                                          'HAMBURG',
                                          'HAMILTON',
                                          'HANOI',
                                          'HANOVER',
                                          'HARARE',
                                          'HAVANA',
                                          'HELSINKI',
                                          'HENDERSON',
                                          'HEREDIA',
                                          'HERMOSILLO',
                                          'HIALEAH',
                                          'HO_CHI MINH CITY',
                                          'HOLLYWOOD',
                                          'HOLON',
                                          'HONOLULU',
                                          'HORTOLANDIA',
                                          'HRODNA',
                                          'HSINCHU',
                                          'HUANCAYO',
                                          'HUANUCO',
                                          'HULL',
                                          'HURLINGHAM',
                                          'HYDERABAD',
                                          'IASI',
                                          'IBAGUE',
                                          'ICA',
                                          'ILAM',
                                          'ILFORD',
                                          'ILIGAN',
                                          'ILOILO_CITY',
                                          'IMPERATRIZ',
                                          'IMUS',
                                          'INCHEON',
                                          'INDAIATUBA',
                                          'INDIANAPOLIS',
                                          'INDORE',
                                          'IPATINGA',
                                          'IPOH',
                                          'IQUIQUE',
                                          'IRVINE',
                                          'ISIDRO_CASANOVA',
                                          'ISLAMABAD',
                                          'ISLINGTON',
                                          'ISMAILIA',
                                          'ISPARTA',
                                          'ISTANBUL',
                                          'ITABORAI',
                                          'ITABUNA',
                                          'ITAJAI',
                                          'ITANHAEM',
                                          'ITAPEVI',
                                          'ITAQUAQUECETUBA',
                                          'ITUZAINGO',
                                          'IZMIR',
                                          'IZTAPALAPA',
                                          'JABOATAO_DOS GUARARAPES',
                                          'JACAREI',
                                          'JACKSON',
                                          'JACKSONVILLE',
                                          'JAIPUR',
                                          'JAKARTA',
                                          'JARAGUA_DO SUL',
                                          'JAU',
                                          'JEDDAH',
                                          'JEMBER',
                                          'JERUSALEM',
                                          'JOAO_MONLEVADE',
                                          'JOAO_PESSOA',
                                          'JODHPUR',
                                          'JOHANNESBURG',
                                          'JOHOR_BAHRU',
                                          'JOINVILLE',
                                          'JOSE_C PAZ',
                                          'JOSE_MARIA EZEIZA',
                                          'JUAREZ',
                                          'JUAZEIRO_DO NORTE',
                                          'JUIZ_DE FORA',
                                          'JUNDIAI',
                                          'KAHRAMANMARAS',
                                          'KAMPALA',
                                          'KANPUR',
                                          'KANSAS_CITY',
                                          'KAOHSIUNG_CITY',
                                          'KARABUK',
                                          'KARACHI',
                                          'KARLSRUHE',
                                          'KARNAL',
                                          'KASKI',
                                          'KASTAMONU',
                                          'KATHMANDU',
                                          'KATOWICE',
                                          'KATSINA',
                                          'KATY',
                                          'KAUNAS',
                                          'KAYSERI',
                                          'KAZAN',
                                          'KECSKEMET',
                                          'KEDIRI',
                                          'KENITRA',
                                          'KHARKIV',
                                          'KHMELNYTSKYI',
                                          'KHON_KAEN',
                                          'KIELCE',
                                          'KIGALI',
                                          'KINGSTON',
                                          'KIRKLARELI',
                                          'KISSIMMEE',
                                          'KITCHENER',
                                          'KLAIPEDA',
                                          'KNOXVILLE',
                                          'KOCHI',
                                          'KOLKATA',
                                          'KOLLAM',
                                          'KONYA',
                                          'KOSEKOY',
                                          'KOSICE',
                                          'KOTA_KINABALU',
                                          'KOZHIKODE',
                                          'KRAKOW',
                                          'KRASNODAR',
                                          'KRYVYI_RIH',
                                          'KUALA_LUMPUR',
                                          'KUCHING',
                                          'KUTAHYA',
                                          'KUTAISI',
                                          'KUWAIT_CITY',
                                          'KYIV',
                                          'LA_PAZ',
                                          'LA_PLATA',
                                          'LA_RIOJA',
                                          'LA_SERENA',
                                          'LAFAYETTE',
                                          'LAFERRERE',
                                          'LAGES',
                                          'LAGOS',
                                          'LAHORE',
                                          'LAHUG',
                                          'LAKE_WORTH',
                                          'LAKELAND',
                                          'LANCASTER',
                                          'LANUS',
                                          'LAS_PALMAS DE GRAN CANARIA',
                                          'LAS_PINAS',
                                          'LAS_VEGAS',
                                          'LAUSANNE',
                                          'LAVAL',
                                          'LAWRENCEVILLE',
                                          'LE_MANS',
                                          'LEEDS',
                                          'LEICESTER',
                                          'LEIPZIG',
                                          'LEON',
                                          'LEXINGTON',
                                          'LIBREVILLE',
                                          'LIEGE',
                                          'LILLE',
                                          'LIMA',
                                          'LIMASSOL',
                                          'LIMEIRA',
                                          'LINCOLN',
                                          'LINHARES',
                                          'LIPA_CITY',
                                          'LISBON',
                                          'LIVERPOOL',
                                          'LJUBLJANA',
                                          'LODZ',
                                          'LOJA',
                                          'LOMAS_DE ZAMORA',
                                          'LOME',
                                          'LONDRINA',
                                          'LONG_BEACH',
                                          'LONGUEUIL',
                                          'LOUISVILLE',
                                          'LUANDA',
                                          'LUBLIN',
                                          'LUCENA_CITY',
                                          'LUCKNOW',
                                          'LUDHIANA',
                                          'LUSAKA',
                                          'LUXEMBOURG',
                                          'LUZIANIA',
                                          'LVIV',
                                          'LYON',
                                          'MABALACAT',
                                          'MACAE',
                                          'MACAO',
                                          'MACAPA',
                                          'MACEIO',
                                          'MACHALA',
                                          'MADISON',
                                          'MADRID',
                                          'MAGE',
                                          'MAGELANG',
                                          'MAGNESIA_AD SIPYLUM',
                                          'MAKASSAR',
                                          'MAKATI_CITY',
                                          'MALABON',
                                          'MALAGA',
                                          'MALANG',
                                          'MALAPPURAM',
                                          'MALDONADO',
                                          'MALE',
                                          'MALMO',
                                          'MANADO',
                                          'MANAGUA',
                                          'MANAMA',
                                          'MANAUS',
                                          'MANCHESTER',
                                          'MANDALUYONG_CITY',
                                          'MANILA',
                                          'MANIZALES',
                                          'MANNHEIM',
                                          'MAPUTO',
                                          'MAR_DEL PLATA',
                                          'MARABA',
                                          'MARACAIBO',
                                          'MARACANAU',
                                          'MARACAY',
                                          'MARDIN',
                                          'MARIBOR',
                                          'MARICA',
                                          'MARIETTA',
                                          'MARIKINA_CITY',
                                          'MARILIA',
                                          'MARINGA',
                                          'MARRAKESH',
                                          'MARSEILLE',
                                          'MAUA',
                                          'MAZATLAN',
                                          'MEDAN',
                                          'MEDELLIN',
                                          'MEDINA',
                                          'MEERUT',
                                          'MEKNES',
                                          'MELBOURNE',
                                          'MEMPHIS',
                                          'MENDOZA',
                                          'MERIDA',
                                          'MERKEZ',
                                          'MERLO',
                                          'MERSIN',
                                          'MESA',
                                          'MEXICALI',
                                          'MEXICO_CITY',
                                          'MILAN',
                                          'MILTON_KEYNES',
                                          'MILWAUKEE',
                                          'MINNEAPOLIS',
                                          'MINSK',
                                          'MISKOLC',
                                          'MISSISSAUGA',
                                          'MOGI_DAS CRUZES',
                                          'MOHALI',
                                          'MONROE',
                                          'MONTE_GRANDE',
                                          'MONTEGO_BAY',
                                          'MONTERREY',
                                          'MONTES_CLAROS',
                                          'MONTEVIDEO',
                                          'MONTGOMERY',
                                          'MONTPELLIER',
                                          'MONTREAL',
                                          'MORELIA',
                                          'MORENO',
                                          'MORON',
                                          'MOSSORO',
                                          'MUGLA',
                                          'MULTAN',
                                          'MUMBAI',
                                          'MUNICH',
                                          'MURCIA',
                                          'MUSCAT',
                                          'MUZAFFARGARH',
                                          'MYKOLAYIV',
                                          'NAALDWIJK',
                                          'NAGA',
                                          'NAGPUR',
                                          'NAIROBI',
                                          'NANTES',
                                          'NAPLES',
                                          'NASHVILLE',
                                          'NASSAU',
                                          'NASUGBU',
                                          'NATAL',
                                          'NAUCALPAN',
                                          'NAVI_MUMBAI',
                                          'NEIVA',
                                          'NEUQUEN',
                                          'NEVSEHIR',
                                          'NEW_DELHI',
                                          'NEW_ORLEANS',
                                          'NEW_TAIPEI',
                                          'NEWARK',
                                          'NEWCASTLE_UPON TYNE',
                                          'NHA_TRANG',
                                          'NICE',
                                          'NICOSIA',
                                          'NILOPOLIS',
                                          'NIS',
                                          'NITEROI',
                                          'NITRA',
                                          'NIZHNIY_NOVGOROD',
                                          'NOGALES',
                                          'NOIDA',
                                          'NORTHAMPTON',
                                          'NORWICH',
                                          'NOTTINGHAM',
                                          'NOVA_FRIBURGO',
                                          'NOVA_IGUACU',
                                          'NOVI_SAD',
                                          'NOVO_HAMBURGO',
                                          'NOVOSIBIRSK',
                                          'NUREMBERG',
                                          'OAKLAND',
                                          'OAXACA_CITY',
                                          'ODESA',
                                          'OKLAHOMA_CITY',
                                          'OLINDA',
                                          'OLOMOUC',
                                          'OLONGAPO_CITY',
                                          'OLSZTYN',
                                          'OMAHA',
                                          'ORADEA',
                                          'ORAN',
                                          'ORDU',
                                          'ORLANDO',
                                          'OSASCO',
                                          'OSLO',
                                          'OSMANIYE',
                                          'OSTRAVA',
                                          'OTTAWA',
                                          'OUJDA',
                                          'OURINHOS',
                                          'PACHUCA',
                                          'PADOVA',
                                          'PALAKKAD',
                                          'PALEMBANG',
                                          'PALERMO',
                                          'PALHOCA',
                                          'PALMA',
                                          'PALMAS',
                                          'PANAMA_CITY',
                                          'PARAMARIBO',
                                          'PARANA',
                                          'PARANAGUA',
                                          'PARANAQUE_CITY',
                                          'PARAUAPEBAS',
                                          'PARIS',
                                          'PARNAIBA',
                                          'PARNAMIRIM',
                                          'PASSO_FUNDO',
                                          'PASTO',
                                          'PATAN',
                                          'PATNA',
                                          'PATOS_DE MINAS',
                                          'PAULISTA',
                                          'PECS',
                                          'PEKANBARU',
                                          'PELOTAS',
                                          'PEORIA',
                                          'PEREIRA',
                                          'PERM',
                                          'PERTH',
                                          'PESCARA',
                                          'PESHAWAR',
                                          'PETAH_TIKVA',
                                          'PETALING_JAYA',
                                          'PETROLINA',
                                          'PETROPOLIS',
                                          'PHILADELPHIA',
                                          'PHNOM_PENH',
                                          'PHOENIX',
                                          'PILAR',
                                          'PINDAMONHANGABA',
                                          'PIRACICABA',
                                          'PITESTI',
                                          'PITTSBURGH',
                                          'PIURA',
                                          'PLANO',
                                          'PLOIESTI',
                                          'PLOVDIV',
                                          'PLYMOUTH',
                                          'POCOS_DE CALDAS',
                                          'PODGORICA',
                                          'POLTAVA',
                                          'PONTA_GROSSA',
                                          'PONTIANAK',
                                          'POPAYAN',
                                          'PORT_AU PRINCE',
                                          'PORT_ELIZABETH',
                                          'PORT_HARCOURT',
                                          'PORT_LOUIS',
                                          'PORT_MONTT',
                                          'PORT_OF SPAIN',
                                          'PORT_SAID',
                                          'PORTLAND',
                                          'PORTO',
                                          'PORTO_ALEGRE',
                                          'PORTO_SEGURO',
                                          'PORTO_VELHO',
                                          'PORTOVIEJO',
                                          'POSADAS',
                                          'POUSO_ALEGRE',
                                          'POZNAN',
                                          'PRAGUE',
                                          'PRAIA_GRANDE',
                                          'PRESIDENTE_PRUDENTE',
                                          'PRETORIA',
                                          'PRISTINA',
                                          'PROVIDENCE',
                                          'PUCALLPA',
                                          'PUCHONG_BATU DUA BELAS',
                                          'PUEBLA_CITY',
                                          'PUNE',
                                          'QUEBEC',
                                          'QUEENS',
                                          'QUEIMADOS',
                                          'QUERETARO_CITY',
                                          'QUEZON_CITY',
                                          'QUILMES',
                                          'QUITO',
                                          'RABAT',
                                          'RAIPUR',
                                          'RAJKOT',
                                          'RAJSHAHI',
                                          'RALEIGH',
                                          'RAMAT_GAN',
                                          'RANCAGUA',
                                          'RANCHI',
                                          'RAS_AL KHAIMAH',
                                          'RAWALPINDI',
                                          'READING',
                                          'RECIFE',
                                          'REGINA',
                                          'RENNES',
                                          'RENO',
                                          'RESISTENCIA',
                                          'REYKJAVIK',
                                          'REYNOSA',
                                          'RIBEIRAO_DAS NEVES',
                                          'RIBEIRAO_PRETO',
                                          'RICHMOND',
                                          'RIGA',
                                          'RIO_BRANCO',
                                          'RIO_CLARO',
                                          'RIO_CUARTO',
                                          'RIO_DE JANEIRO',
                                          'RIO_DO SUL',
                                          'RIO_GALLEGOS',
                                          'RIO_GRANDE',
                                          'RISHON_LETSIYYON',
                                          'RIVERSIDE',
                                          'RIYADH',
                                          'RIZE',
                                          'ROCHESTER',
                                          'ROME',
                                          'RONDONOPOLIS',
                                          'ROSARIO',
                                          'ROSEAU',
                                          'ROSTOV_ON DON',
                                          'ROTTERDAM',
                                          'ROUEN',
                                          'ROUSSE',
                                          'RZESZOW',
                                          'SACRAMENTO',
                                          'SAGAR',
                                          'SAINT_PAUL',
                                          'SALE',
                                          'SALT_LAKE CITY',
                                          'SALTA',
                                          'SALTILLO',
                                          'SALVADOR',
                                          'SAMARA',
                                          'SAMARINDA',
                                          'SAMARKAND',
                                          'SAMSUN',
                                          'SAN_ANTONIO',
                                          'SAN_DIEGO',
                                          'SAN_FERNANDO',
                                          'SAN_FRANCISCO',
                                          'SAN_JOSE',
                                          'SAN_JOSE DEL MONTE',
                                          'SAN_JUAN',
                                          'SAN_JUSTO',
                                          'SAN_LUIS',
                                          'SAN_LUIS POTOSI CITY',
                                          'SAN_MIGUEL',
                                          'SAN_MIGUEL DE TUCUMAN',
                                          'SAN_PABLO CITY',
                                          'SAN_PEDRO',
                                          'SAN_PEDRO SULA',
                                          'SAN_SALVADOR',
                                          'SAN_SALVADOR DE JUJUY',
                                          'SANAA',
                                          'SANLIURFA',
                                          'SANTA_CRUZ',
                                          'SANTA_CRUZ DE TENERIFE',
                                          'SANTA_CRUZ DO SUL',
                                          'SANTA_FE',
                                          'SANTA_LUZIA',
                                          'SANTA_MARIA',
                                          'SANTA_MARTA',
                                          'SANTA_ROSA',
                                          'SANTAREM',
                                          'SANTIAGO',
                                          'SANTIAGO_DE CALI',
                                          'SANTIAGO_DE LOS CABALLEROS',
                                          'SANTO_ANDRE',
                                          'SANTO_DOMINGO',
                                          'SANTO_DOMINGO ESTE',
                                          'SANTOS',
                                          'SAO_BERNARDO DO CAMPO',
                                          'SAO_CARLOS',
                                          'SAO_GONCALO',
                                          'SAO_JOAO DE MERITI',
                                          'SAO_JOSE',
                                          'SAO_JOSE DO RIO PRETO',
                                          'SAO_JOSE DOS CAMPOS',
                                          'SAO_JOSE DOS PINHAIS',
                                          'SAO_LEOPOLDO',
                                          'SAO_LUIS',
                                          'SAO_PAULO',
                                          'SAO_VICENTE',
                                          'SARAJEVO',
                                          'SASKATOON',
                                          'SCARBOROUGH',
                                          'SEATTLE',
                                          'SEMARANG',
                                          'SEO_GU',
                                          'SEONGNAM_SI',
                                          'SEOUL',
                                          'SERRA',
                                          'SETE_LAGOAS',
                                          'SETIF',
                                          'SETUBAL',
                                          'SEVILLE',
                                          'SFAX',
                                          'SHAH_ALAM',
                                          'SHANGHAI',
                                          'SHARJAH',
                                          'SHEFFIELD',
                                          'SHENZHEN',
                                          'SHIMLA',
                                          'SIAULIAI',
                                          'SIBIU',
                                          'SIDOARJO',
                                          'SIKAR',
                                          'SILVER_SPRING',
                                          'SINOP',
                                          'SIVAS',
                                          'SKIKDA',
                                          'SKOPJE',
                                          'SLOUGH',
                                          'SOBRAL',
                                          'SOFIA',
                                          'SOROCABA',
                                          'SOUSSE',
                                          'SOUTH_TANGERANG',
                                          'SOUTHAMPTON',
                                          'SOUTHWARK',
                                          'SPLIT',
                                          'SPOKANE',
                                          'SPRING',
                                          'SPRINGFIELD',
                                          'ST_LOUIS',
                                          'ST_PETERSBURG',
                                          'STARA_ZAGORA',
                                          'STATEN_ISLAND',
                                          'STOCKHOLM',
                                          'STOCKTON',
                                          'STOKE_ON TRENT',
                                          'STRASBOURG',
                                          'STUTTGART',
                                          'SUMARE',
                                          'SURABAYA',
                                          'SURAKARTA',
                                          'SURAT',
                                          'SURREY',
                                          'SUWON',
                                          'SUZANO',
                                          'SYDNEY',
                                          'SZCZECIN',
                                          'SZEGED',
                                          'SZEKESFEHERVAR',
                                          'TABOAO_DA SERRA',
                                          'TACNA',
                                          'TACOMA',
                                          'TAGUIG',
                                          'TAICHUNG',
                                          'TAINAN_CITY',
                                          'TAIPEI',
                                          'TALAVERA',
                                          'TALCA',
                                          'TALLAHASSEE',
                                          'TALLINN',
                                          'TAMPA',
                                          'TAMPERE',
                                          'TAMPICO',
                                          'TANGERANG',
                                          'TANGIER',
                                          'TANTA',
                                          'TANZA',
                                          'TAOYUAN_DISTRICT',
                                          'TAPPAHANNOCK',
                                          'TARLAC_CITY',
                                          'TASHKENT',
                                          'TASIKMALAYA',
                                          'TATUI',
                                          'TAUBATE',
                                          'TBILISI',
                                          'TEGUCIGALPA',
                                          'TEHRAN',
                                          'TEIXEIRA_DE FREITAS',
                                          'TEKIRDAG',
                                          'TEL_AVIV',
                                          'TEMUCO',
                                          'TEPIC',
                                          'TERESINA',
                                          'TERNOPIL',
                                          'TERRASSA',
                                          'TETOUAN',
                                          'THANE',
                                          'THE_BRONX',
                                          'THE_HAGUE',
                                          'THESSALONIKI',
                                          'THIRUVANANTHAPURAM',
                                          'THRISSUR',
                                          'TIJUANA',
                                          'TIMISOARA',
                                          'TIRANA',
                                          'TLALNEPANTLA',
                                          'TLAXCALA_CITY',
                                          'TLEMCEN',
                                          'TOKAT_PROVINCE',
                                          'TOKYO',
                                          'TOLUCA',
                                          'TORONTO',
                                          'TORREON',
                                          'TOULOUSE',
                                          'TRABZON',
                                          'TRUJILLO',
                                          'TUBARAO',
                                          'TUCSON',
                                          'TUGUEGARAO_CITY',
                                          'TULSA',
                                          'TUNIS',
                                          'TUNJA',
                                          'TURIN',
                                          'TUXTLA_GUTIERREZ',
                                          'TUZLA',
                                          'UBERABA',
                                          'UBERLANDIA',
                                          'UFA',
                                          'ULAN_BATOR',
                                          'UMEDA',
                                          'URDANETA',
                                          'USAK',
                                          'VADODARA',
                                          'VALENCIA',
                                          'VALINHOS',
                                          'VALLADOLID',
                                          'VALLEDUPAR',
                                          'VALPARAISO',
                                          'VALPARAISO_DE GOIAS',
                                          'VAN',
                                          'VANCOUVER',
                                          'VARANASI',
                                          'VARGINHA',
                                          'VARNA',
                                          'VARZEA_PAULISTA',
                                          'VENUSTIANO_CARRANZA',
                                          'VERACRUZ',
                                          'VERONA',
                                          'VIAMAO',
                                          'VICTORIA',
                                          'VIENNA',
                                          'VIENTIANE',
                                          'VIGO',
                                          'VIJAYAWADA',
                                          'VILA_NOVA DE GAIA',
                                          'VILA_VELHA',
                                          'VILLA_BALLESTER',
                                          'VILLAVICENCIO',
                                          'VILNIUS',
                                          'VINA_DEL MAR',
                                          'VINNYTSIA',
                                          'VIRGINIA_BEACH',
                                          'VISAKHAPATNAM',
                                          'VITORIA',
                                          'VITORIA_DA CONQUISTA',
                                          'VITORIA_DE SANTO ANTAO',
                                          'VOLTA_REDONDA',
                                          'VORONEZH',
                                          'WARSAW',
                                          'WASHINGTON',
                                          'WELLINGTON',
                                          'WEST_PALM BEACH',
                                          'WICHITA',
                                          'WILLEMSTAD',
                                          'WILMINGTON',
                                          'WINDHOEK',
                                          'WINDSOR',
                                          'WINNIPEG',
                                          'WOLVERHAMPTON',
                                          'WOODBRIDGE',
                                          'WROCLAW',
                                          'WUPPERTAL',
                                          'XALAPA',
                                          'YALOVA',
                                          'YANGON',
                                          'YEKATERINBURG',
                                          'YEREVAN',
                                          'YOGYAKARTA',
                                          'YOKOHAMA',
                                          'YONGIN_SI',
                                          'ZABRZE',
                                          'ZAGAZIG',
                                          'ZAGREB',
                                          'ZAMBOANGA_CITY',
                                          'ZAPOPAN',
                                          'ZAPORIZHZHYA',
                                          'ZARAGOZA',
                                          'ZHONGLI_DISTRICT',
                                          'ZIELONA_GORA',
                                          'ZONGULDAK',
                                          'ZURICH',
                                        ],
                                        description: "City name (e.g., 'NEW_YORK', 'LOS_ANGELES')",
                                      },
                                      state: {
                                        type: 'string',
                                        enum: [
                                          'AL',
                                          'AK',
                                          'AZ',
                                          'AR',
                                          'CA',
                                          'CO',
                                          'CT',
                                          'DE',
                                          'FL',
                                          'GA',
                                          'HI',
                                          'ID',
                                          'IL',
                                          'IN',
                                          'IA',
                                          'KS',
                                          'KY',
                                          'LA',
                                          'ME',
                                          'MD',
                                          'MA',
                                          'MI',
                                          'MN',
                                          'MS',
                                          'MO',
                                          'MT',
                                          'NE',
                                          'NV',
                                          'NH',
                                          'NJ',
                                          'NM',
                                          'NY',
                                          'NC',
                                          'ND',
                                          'OH',
                                          'OK',
                                          'OR',
                                          'PA',
                                          'RI',
                                          'SC',
                                          'SD',
                                          'TN',
                                          'TX',
                                          'UT',
                                          'VT',
                                          'VA',
                                          'WA',
                                          'WV',
                                          'WI',
                                          'WY',
                                          'DC',
                                          'PR',
                                          'GU',
                                          'VI',
                                        ],
                                        description:
                                          "State code (e.g., 'NY', 'CA') - US states only",
                                      },
                                      country: {
                                        type: 'string',
                                        enum: [
                                          'US',
                                          'CA',
                                          'MX',
                                          'GB',
                                          'DE',
                                          'FR',
                                          'IT',
                                          'ES',
                                          'PL',
                                          'NL',
                                          'SE',
                                          'NO',
                                          'DK',
                                          'FI',
                                          'CH',
                                          'AT',
                                          'BE',
                                          'IE',
                                          'PT',
                                          'GR',
                                          'CZ',
                                          'HU',
                                          'RO',
                                          'BG',
                                          'SK',
                                          'SI',
                                          'HR',
                                          'EE',
                                          'LV',
                                          'LT',
                                          'LU',
                                          'MT',
                                          'CY',
                                          'IS',
                                          'LI',
                                          'MC',
                                          'SM',
                                          'VA',
                                          'JP',
                                          'KR',
                                          'CN',
                                          'HK',
                                          'TW',
                                          'SG',
                                          'AU',
                                          'NZ',
                                          'IN',
                                          'TH',
                                          'MY',
                                          'PH',
                                          'ID',
                                          'VN',
                                          'AF',
                                          'BD',
                                          'BN',
                                          'KH',
                                          'LA',
                                          'LK',
                                          'MM',
                                          'NP',
                                          'PK',
                                          'FJ',
                                          'PG',
                                          'AE',
                                          'SA',
                                          'IL',
                                          'TR',
                                          'IR',
                                          'IQ',
                                          'JO',
                                          'KW',
                                          'LB',
                                          'OM',
                                          'QA',
                                          'BH',
                                          'YE',
                                          'SY',
                                          'ZA',
                                          'EG',
                                          'MA',
                                          'NG',
                                          'KE',
                                          'DZ',
                                          'AO',
                                          'BW',
                                          'ET',
                                          'GH',
                                          'CI',
                                          'LY',
                                          'MZ',
                                          'RW',
                                          'SN',
                                          'TN',
                                          'UG',
                                          'ZM',
                                          'ZW',
                                          'TZ',
                                          'MU',
                                          'SC',
                                          'BR',
                                          'AR',
                                          'CL',
                                          'CO',
                                          'PE',
                                          'VE',
                                          'EC',
                                          'UY',
                                          'PY',
                                          'BO',
                                          'CR',
                                          'CU',
                                          'DO',
                                          'GT',
                                          'HN',
                                          'JM',
                                          'NI',
                                          'PA',
                                          'SV',
                                          'TT',
                                          'BB',
                                          'BZ',
                                          'GY',
                                          'SR',
                                          'RU',
                                          'UA',
                                          'BY',
                                          'KZ',
                                          'UZ',
                                          'AZ',
                                          'GE',
                                          'AM',
                                          'MD',
                                          'MK',
                                          'AL',
                                          'BA',
                                          'RS',
                                          'ME',
                                          'XK',
                                          'MN',
                                          'KG',
                                          'TJ',
                                          'TM',
                                        ],
                                        description:
                                          "Country code (e.g., 'US', 'GB', 'DE') - ISO 3166-1 alpha-2",
                                      },
                                    },
                                    required: ['country'],
                                    additionalProperties: false,
                                    description: 'Geographic location for the proxy',
                                  },
                                },
                                required: ['geolocation'],
                                additionalProperties: false,
                              },
                              {
                                type: 'object',
                                properties: {
                                  server: {
                                    type: 'string',
                                    description: 'Proxy server URL',
                                  },
                                },
                                required: ['server'],
                                additionalProperties: false,
                              },
                            ],
                            description: 'Array of proxy configurations with routing',
                          },
                        ],
                      },
                    ],
                    description:
                      'Proxy configuration for the session. Can be a boolean or array of proxy configurations',
                  },
                  {},
                ],
                description:
                  'Proxy configuration for the session. Can be a boolean or array of proxy configurations',
              },
              proxyUrl: {
                type: 'string',
                format: 'uri',
                description:
                  'Custom proxy URL for the browser session. Overrides useProxy, disabling Steel-provided proxies in favor of your specified proxy. Format: http(s)://username:password@hostname:port',
              },
              blockAds: {
                type: 'boolean',
                description: 'Block ads in the browser session. Default is false.',
              },
              solveCaptcha: {
                type: 'boolean',
                description: 'Enable automatic captcha solving. Default is false.',
              },
              sessionContext: {
                type: 'object',
                properties: {
                  cookies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                          description: 'The name of the cookie',
                        },
                        value: {
                          type: 'string',
                          description: 'The value of the cookie',
                        },
                        url: {
                          type: 'string',
                          description: 'The URL of the cookie',
                        },
                        domain: {
                          type: 'string',
                          description: 'The domain of the cookie',
                        },
                        path: {
                          type: 'string',
                          description: 'The path of the cookie',
                        },
                        secure: {
                          type: 'boolean',
                          description: 'Whether the cookie is secure',
                        },
                        httpOnly: {
                          type: 'boolean',
                          description: 'Whether the cookie is HTTP only',
                        },
                        sameSite: {
                          type: 'string',
                          enum: ['Strict', 'Lax', 'None'],
                          description: 'The same site attribute of the cookie',
                        },
                        size: {
                          type: 'number',
                          description: 'The size of the cookie',
                        },
                        expires: {
                          type: 'number',
                          description: 'The expiration date of the cookie',
                        },
                        partitionKey: {
                          type: 'object',
                          properties: {
                            topLevelSite: {
                              type: 'string',
                              description:
                                'The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie.',
                            },
                            hasCrossSiteAncestor: {
                              type: 'boolean',
                              description:
                                'Indicates if the cookie has any ancestors that are cross-site to the topLevelSite.',
                            },
                          },
                          required: ['topLevelSite', 'hasCrossSiteAncestor'],
                          additionalProperties: false,
                          description: 'The partition key of the cookie',
                        },
                        session: {
                          type: 'boolean',
                          description: 'Whether the cookie is a session cookie',
                        },
                        priority: {
                          type: 'string',
                          enum: ['Low', 'Medium', 'High'],
                          description: 'The priority of the cookie',
                        },
                        sameParty: {
                          type: 'boolean',
                          description: 'Whether the cookie is a same party cookie',
                        },
                        sourceScheme: {
                          type: 'string',
                          enum: ['Unset', 'NonSecure', 'Secure'],
                          description: 'The source scheme of the cookie',
                        },
                        sourcePort: {
                          type: 'number',
                          description: 'The source port of the cookie',
                        },
                      },
                      required: ['name', 'value'],
                      additionalProperties: false,
                    },
                    description: 'Cookies to initialize in the session',
                  },
                  localStorage: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      additionalProperties: {
                        type: 'string',
                      },
                    },
                    description: 'Domain-specific localStorage items to initialize in the session',
                  },
                  sessionStorage: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      additionalProperties: {
                        type: 'string',
                      },
                    },
                    description:
                      'Domain-specific sessionStorage items to initialize in the session',
                  },
                  indexedDB: {
                    type: 'object',
                    additionalProperties: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'number',
                          },
                          name: {
                            type: 'string',
                          },
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: {
                                  type: 'number',
                                },
                                name: {
                                  type: 'string',
                                },
                                records: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      key: {},
                                      value: {},
                                      blobFiles: {
                                        type: 'array',
                                        items: {
                                          type: 'object',
                                          properties: {
                                            blobNumber: {
                                              type: 'number',
                                            },
                                            mimeType: {
                                              type: 'string',
                                            },
                                            size: {
                                              type: 'number',
                                            },
                                            filename: {
                                              type: 'string',
                                            },
                                            lastModified: {
                                              type: 'string',
                                              format: 'date-time',
                                            },
                                            path: {
                                              type: 'string',
                                            },
                                          },
                                          required: ['blobNumber', 'mimeType', 'size'],
                                          additionalProperties: false,
                                        },
                                      },
                                    },
                                    additionalProperties: false,
                                  },
                                },
                              },
                              required: ['id', 'name', 'records'],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ['id', 'name', 'data'],
                        additionalProperties: false,
                      },
                    },
                    description: 'Domain-specific indexedDB items to initialize in the session',
                  },
                },
                additionalProperties: false,
                description:
                  'Session context data to be used in the created session. Sessions will start with an empty context by default.',
              },
              timeout: {
                type: 'integer',
                description:
                  'Session timeout duration in milliseconds. Default is 300000 (5 minutes).',
              },
              concurrency: {
                type: 'integer',
                description: 'Number of sessions to create concurrently (check your plan limit)',
              },
              isSelenium: {
                type: 'boolean',
                description:
                  'Enable Selenium mode for the browser session (default is false). Use this when you plan to connect to the browser session via Selenium.',
              },
              dimensions: {
                type: 'object',
                properties: {
                  width: {
                    type: 'integer',
                    description: 'Width of the session',
                  },
                  height: {
                    type: 'integer',
                    description: 'Height of the session',
                  },
                },
                required: ['width', 'height'],
                additionalProperties: false,
                description: 'Viewport and browser window dimensions for the session',
              },
              namespace: {
                type: 'string',
                description:
                  'The namespace the session should be created against. Defaults to "default".',
              },
              credentials: {
                type: 'object',
                properties: {
                  autoSubmit: {
                    type: 'boolean',
                  },
                  blurFields: {
                    type: 'boolean',
                  },
                  exactOrigin: {
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
                description: 'Configuration for session credentials',
              },
              region: {
                type: 'string',
                enum: ['lax', 'ord', 'iad', 'bom', 'scl', 'fra', 'hkg'],
                description: 'The desired region for the session to be started in',
              },
              stealthConfig: {
                type: 'object',
                properties: {
                  humanizeInteractions: {
                    type: 'boolean',
                    description:
                      'This flag will make the browser act more human-like by moving the mouse in a more natural way.',
                  },
                  skipFingerprintInjection: {
                    type: 'boolean',
                    description: 'This flag will skip the fingerprint generation for the session.',
                  },
                },
                additionalProperties: false,
                description: 'Stealth configuration for the session',
              },
              extensionIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description:
                  "Array of extension IDs to install in the session. Use ['all_ext'] to install all uploaded extensions.",
              },
            },
            additionalProperties: false,
            nullable: true,
            description: 'Request body schema for creating a new browser session.',
          },
          UpdateSessionRequest: {
            title: 'updateSessionRequest',
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                format: 'uuid',
                description: 'Optional custom UUID for the session',
              },
              userAgent: {
                type: 'string',
                description: 'Custom user agent string for the browser session',
              },
              useProxy: {
                anyOf: [
                  {
                    anyOf: [
                      {
                        not: {},
                      },
                      {
                        anyOf: [
                          {
                            type: 'boolean',
                            description: 'Simple boolean to enable/disable Steel proxies',
                          },
                          {
                            anyOf: [
                              {
                                type: 'object',
                                properties: {
                                  geolocation: {
                                    type: 'object',
                                    properties: {
                                      city: {
                                        type: 'string',
                                        enum: [
                                          'A_CORUNA',
                                          'ABIDJAN',
                                          'ABU_DHABI',
                                          'ABUJA',
                                          'ACAPULCO_DE JUAREZ',
                                          'ACCRA',
                                          'ADANA',
                                          'ADAPAZARI',
                                          'ADDIS_ABABA',
                                          'ADELAIDE',
                                          'AFYONKARAHISAR',
                                          'AGADIR',
                                          'AGUAS_LINDAS DE GOIAS',
                                          'AGUASCALIENTES',
                                          'AHMEDABAD',
                                          'AIZAWL',
                                          'AJMAN',
                                          'AKRON',
                                          'AKSARAY',
                                          'AL_AIN CITY',
                                          'AL_MANSURAH',
                                          'AL_QATIF',
                                          'ALAJUELA',
                                          'ALBANY',
                                          'ALBUQUERQUE',
                                          'ALEXANDRIA',
                                          'ALGIERS',
                                          'ALICANTE',
                                          'ALMADA',
                                          'ALMATY',
                                          'ALMERE_STAD',
                                          'ALVORADA',
                                          'AMADORA',
                                          'AMASYA',
                                          'AMBATO',
                                          'AMERICANA',
                                          'AMMAN',
                                          'AMSTERDAM',
                                          'ANANINDEUA',
                                          'ANAPOLIS',
                                          'ANGELES_CITY',
                                          'ANGERS',
                                          'ANGRA_DOS REIS',
                                          'ANKARA',
                                          'ANTAKYA',
                                          'ANTALYA',
                                          'ANTANANARIVO',
                                          'ANTIPOLO_CITY',
                                          'ANTOFAGASTA',
                                          'ANTWERP',
                                          'APARECIDA_DE GOIANIA',
                                          'APODACA',
                                          'ARACAJU',
                                          'ARACATUBA',
                                          'ARAD',
                                          'ARAGUAINA',
                                          'ARAPIRACA',
                                          'ARARAQUARA',
                                          'AREQUIPA',
                                          'ARICA',
                                          'ARLINGTON',
                                          'ARYANAH',
                                          'ASTANA',
                                          'ASUNCION',
                                          'ASYUT',
                                          'ATAKUM',
                                          'ATHENS',
                                          'ATIBAIA',
                                          'ATLANTA',
                                          'AUBURN',
                                          'AUCKLAND',
                                          'AURORA',
                                          'AUSTIN',
                                          'AVELLANEDA',
                                          'AYDIN',
                                          'AZCAPOTZALCO',
                                          'BACOLOD_CITY',
                                          'BACOOR',
                                          'BAGHDAD',
                                          'BAGUIO_CITY',
                                          'BAHIA_BLANCA',
                                          'BAKERSFIELD',
                                          'BAKU',
                                          'BALIKESIR',
                                          'BALIKPAPAN',
                                          'BALNEARIO_CAMBORIU',
                                          'BALTIMORE',
                                          'BANDAR_LAMPUNG',
                                          'BANDAR_SERI BEGAWAN',
                                          'BANDUNG',
                                          'BANGKOK',
                                          'BANJA_LUKA',
                                          'BANJARMASIN',
                                          'BARCELONA',
                                          'BARI',
                                          'BARQUISIMETO',
                                          'BARRA_MANSA',
                                          'BARRANQUILLA',
                                          'BARUERI',
                                          'BATAM',
                                          'BATANGAS',
                                          'BATMAN',
                                          'BATNA_CITY',
                                          'BATON_ROUGE',
                                          'BATUMI',
                                          'BAURU',
                                          'BEIRUT',
                                          'BEJAIA',
                                          'BEKASI',
                                          'BELEM',
                                          'BELFAST',
                                          'BELFORD_ROXO',
                                          'BELGRADE',
                                          'BELO_HORIZONTE',
                                          'BENGALURU',
                                          'BENI_MELLAL',
                                          'BERAZATEGUI',
                                          'BERN',
                                          'BETIM',
                                          'BHARATPUR',
                                          'BHOPAL',
                                          'BHUBANESWAR',
                                          'BIALYSTOK',
                                          'BIEN_HOA',
                                          'BILBAO',
                                          'BILECIK',
                                          'BIRATNAGAR',
                                          'BIRMINGHAM',
                                          'BISHKEK',
                                          'BIZERTE',
                                          'BLIDA',
                                          'BLOEMFONTEIN',
                                          'BLOOMINGTON',
                                          'BLUMENAU',
                                          'BOA_VISTA',
                                          'BOCHUM',
                                          'BOGOR',
                                          'BOGOTA',
                                          'BOISE',
                                          'BOKSBURG',
                                          'BOLOGNA',
                                          'BOLU',
                                          'BORDEAUX',
                                          'BOSTON',
                                          'BOTUCATU',
                                          'BRADFORD',
                                          'BRAGA',
                                          'BRAGANCA_PAULISTA',
                                          'BRAMPTON',
                                          'BRASILIA',
                                          'BRASOV',
                                          'BRATISLAVA',
                                          'BREMEN',
                                          'BRESCIA',
                                          'BREST',
                                          'BRIDGETOWN',
                                          'BRISBANE',
                                          'BRISTOL',
                                          'BRNO',
                                          'BROOKLYN',
                                          'BRUSSELS',
                                          'BUCARAMANGA',
                                          'BUCHAREST',
                                          'BUDAPEST',
                                          'BUENOS_AIRES',
                                          'BUFFALO',
                                          'BUK_GU',
                                          'BUKHARA',
                                          'BURGAS',
                                          'BURNABY',
                                          'BURSA',
                                          'BUTUAN',
                                          'BYDGOSZCZ',
                                          'CABANATUAN_CITY',
                                          'CABO_FRIO',
                                          'CABUYAO',
                                          'CACHOEIRO_DE ITAPEMIRIM',
                                          'CAGAYAN_DE ORO',
                                          'CAGLIARI',
                                          'CAIRO',
                                          'CALAMBA',
                                          'CALGARY',
                                          'CALOOCAN_CITY',
                                          'CAMACARI',
                                          'CAMARAGIBE',
                                          'CAMPECHE',
                                          'CAMPINA_GRANDE',
                                          'CAMPINAS',
                                          'CAMPO_GRANDE',
                                          'CAMPO_LARGO',
                                          'CAMPOS_DOS GOYTACAZES',
                                          'CAN_THO',
                                          'CANOAS',
                                          'CANTON',
                                          'CAPE_TOWN',
                                          'CARACAS',
                                          'CARAGUATATUBA',
                                          'CARAPICUIBA',
                                          'CARDIFF',
                                          'CARIACICA',
                                          'CARMONA',
                                          'CARTAGENA',
                                          'CARUARU',
                                          'CASABLANCA',
                                          'CASCAVEL',
                                          'CASEROS',
                                          'CASTANHAL',
                                          'CASTRIES',
                                          'CATALAO',
                                          'CATAMARCA',
                                          'CATANDUVA',
                                          'CATANIA',
                                          'CAUCAIA',
                                          'CAXIAS_DO SUL',
                                          'CEBU_CITY',
                                          'CENTRAL',
                                          'CENTRO',
                                          'CENTURION',
                                          'CHAGUANAS',
                                          'CHANDIGARH',
                                          'CHANDLER',
                                          'CHANG_HUA',
                                          'CHAPECO',
                                          'CHARLESTON',
                                          'CHARLOTTE',
                                          'CHELYABINSK',
                                          'CHENNAI',
                                          'CHERKASY',
                                          'CHERNIVTSI',
                                          'CHIA',
                                          'CHIANG_MAI',
                                          'CHICLAYO',
                                          'CHIHUAHUA_CITY',
                                          'CHIMBOTE',
                                          'CHISINAU',
                                          'CHITTAGONG',
                                          'CHRISTCHURCH',
                                          'CINCINNATI',
                                          'CIREBON',
                                          'CITY_OF MUNTINLUPA',
                                          'CIUDAD_DEL ESTE',
                                          'CIUDAD_GUAYANA',
                                          'CIUDAD_JUAREZ',
                                          'CIUDAD_NEZAHUALCOYOTL',
                                          'CIUDAD_OBREGON',
                                          'CLEVELAND',
                                          'CLUJ_NAPOCA',
                                          'COCHABAMBA',
                                          'COIMBATORE',
                                          'COIMBRA',
                                          'COLOGNE',
                                          'COLOMBO',
                                          'COLORADO_SPRINGS',
                                          'COLUMBIA',
                                          'COLUMBUS',
                                          'COMODORO_RIVADAVIA',
                                          'CONCEPCION',
                                          'CONCORD',
                                          'CONSTANTA',
                                          'CONSTANTINE',
                                          'CONTAGEM',
                                          'COPENHAGEN',
                                          'CORDOBA',
                                          'CORRIENTES',
                                          'CORUM',
                                          'COTIA',
                                          'COVENTRY',
                                          'CRAIOVA',
                                          'CRICIUMA',
                                          'CROYDON',
                                          'CUAUTITLAN_IZCALLI',
                                          'CUCUTA',
                                          'CUENCA',
                                          'CUERNAVACA',
                                          'CUIABA',
                                          'CULIACAN',
                                          'CURITIBA',
                                          'CUSCO',
                                          'DA_NANG',
                                          'DAGUPAN',
                                          'DAKAR',
                                          'DALLAS',
                                          'DAMIETTA',
                                          'DAMMAM',
                                          'DAR_ES SALAAM',
                                          'DASMARINAS',
                                          'DAVAO_CITY',
                                          'DAYTON',
                                          'DEBRECEN',
                                          'DECATUR',
                                          'DEHRADUN',
                                          'DELHI',
                                          'DENIZLI',
                                          'DENPASAR',
                                          'DENVER',
                                          'DEPOK',
                                          'DERBY',
                                          'DETROIT',
                                          'DHAKA',
                                          'DIADEMA',
                                          'DIVINOPOLIS',
                                          'DIYARBAKIR',
                                          'DJELFA',
                                          'DNIPRO',
                                          'DOHA',
                                          'DORTMUND',
                                          'DOURADOS',
                                          'DRESDEN',
                                          'DUBAI',
                                          'DUBLIN',
                                          'DUEZCE',
                                          'DUISBURG',
                                          'DUQUE_DE CAXIAS',
                                          'DURANGO',
                                          'DURBAN',
                                          'DUSSELDORF',
                                          'ECATEPEC',
                                          'EDINBURGH',
                                          'EDIRNE',
                                          'EDMONTON',
                                          'EL_JADIDA',
                                          'EL_PASO',
                                          'ELAZIG',
                                          'EMBU',
                                          'ENSENADA',
                                          'ERBIL',
                                          'ERZURUM',
                                          'ESKISEHIR',
                                          'ESPOO',
                                          'ESSEN',
                                          'FAISALABAD',
                                          'FAYETTEVILLE',
                                          'FAZENDA_RIO GRANDE',
                                          'FEIRA_DE SANTANA',
                                          'FES',
                                          'FLORENCE',
                                          'FLORENCIO_VARELA',
                                          'FLORIANOPOLIS',
                                          'FONTANA',
                                          'FORMOSA',
                                          'FORT_LAUDERDALE',
                                          'FORT_WAYNE',
                                          'FORT_WORTH',
                                          'FORTALEZA',
                                          'FOZ_DO IGUACU',
                                          'FRANCA',
                                          'FRANCISCO_MORATO',
                                          'FRANCO_DA ROCHA',
                                          'FRANKFURT_AM MAIN',
                                          'FREDERICKSBURG',
                                          'FRESNO',
                                          'FUNCHAL',
                                          'GABORONE',
                                          'GAINESVILLE',
                                          'GALATI',
                                          'GANGNAM_GU',
                                          'GARANHUNS',
                                          'GATINEAU',
                                          'GAZIANTEP',
                                          'GDANSK',
                                          'GDYNIA',
                                          'GENERAL_TRIAS',
                                          'GENEVA',
                                          'GENOA',
                                          'GEORGE_TOWN',
                                          'GEORGETOWN',
                                          'GHAZIABAD',
                                          'GHENT',
                                          'GIJON',
                                          'GIRESUN',
                                          'GIZA',
                                          'GLASGOW',
                                          'GLENDALE',
                                          'GLIWICE',
                                          'GOIANIA',
                                          'GOMEL',
                                          'GOTHENBURG',
                                          'GOVERNADOR_VALADARES',
                                          'GOYANG_SI',
                                          'GRANADA',
                                          'GRAND_RAPIDS',
                                          'GRAVATAI',
                                          'GRAZ',
                                          'GREENSBORO',
                                          'GREENVILLE',
                                          'GUADALAJARA',
                                          'GUADALUPE',
                                          'GUANGZHOU',
                                          'GUARAPUAVA',
                                          'GUARATINGUETA',
                                          'GUARUJA',
                                          'GUARULHOS',
                                          'GUATEMALA_CITY',
                                          'GUAYAQUIL',
                                          'GUJRANWALA',
                                          'GURUGRAM',
                                          'GUSTAVO_ADOLFO MADERO',
                                          'GUWAHATI',
                                          'GWANAK_GU',
                                          'HACKNEY',
                                          'HAIFA',
                                          'HAIPHONG',
                                          'HAMBURG',
                                          'HAMILTON',
                                          'HANOI',
                                          'HANOVER',
                                          'HARARE',
                                          'HAVANA',
                                          'HELSINKI',
                                          'HENDERSON',
                                          'HEREDIA',
                                          'HERMOSILLO',
                                          'HIALEAH',
                                          'HO_CHI MINH CITY',
                                          'HOLLYWOOD',
                                          'HOLON',
                                          'HONOLULU',
                                          'HORTOLANDIA',
                                          'HRODNA',
                                          'HSINCHU',
                                          'HUANCAYO',
                                          'HUANUCO',
                                          'HULL',
                                          'HURLINGHAM',
                                          'HYDERABAD',
                                          'IASI',
                                          'IBAGUE',
                                          'ICA',
                                          'ILAM',
                                          'ILFORD',
                                          'ILIGAN',
                                          'ILOILO_CITY',
                                          'IMPERATRIZ',
                                          'IMUS',
                                          'INCHEON',
                                          'INDAIATUBA',
                                          'INDIANAPOLIS',
                                          'INDORE',
                                          'IPATINGA',
                                          'IPOH',
                                          'IQUIQUE',
                                          'IRVINE',
                                          'ISIDRO_CASANOVA',
                                          'ISLAMABAD',
                                          'ISLINGTON',
                                          'ISMAILIA',
                                          'ISPARTA',
                                          'ISTANBUL',
                                          'ITABORAI',
                                          'ITABUNA',
                                          'ITAJAI',
                                          'ITANHAEM',
                                          'ITAPEVI',
                                          'ITAQUAQUECETUBA',
                                          'ITUZAINGO',
                                          'IZMIR',
                                          'IZTAPALAPA',
                                          'JABOATAO_DOS GUARARAPES',
                                          'JACAREI',
                                          'JACKSON',
                                          'JACKSONVILLE',
                                          'JAIPUR',
                                          'JAKARTA',
                                          'JARAGUA_DO SUL',
                                          'JAU',
                                          'JEDDAH',
                                          'JEMBER',
                                          'JERUSALEM',
                                          'JOAO_MONLEVADE',
                                          'JOAO_PESSOA',
                                          'JODHPUR',
                                          'JOHANNESBURG',
                                          'JOHOR_BAHRU',
                                          'JOINVILLE',
                                          'JOSE_C PAZ',
                                          'JOSE_MARIA EZEIZA',
                                          'JUAREZ',
                                          'JUAZEIRO_DO NORTE',
                                          'JUIZ_DE FORA',
                                          'JUNDIAI',
                                          'KAHRAMANMARAS',
                                          'KAMPALA',
                                          'KANPUR',
                                          'KANSAS_CITY',
                                          'KAOHSIUNG_CITY',
                                          'KARABUK',
                                          'KARACHI',
                                          'KARLSRUHE',
                                          'KARNAL',
                                          'KASKI',
                                          'KASTAMONU',
                                          'KATHMANDU',
                                          'KATOWICE',
                                          'KATSINA',
                                          'KATY',
                                          'KAUNAS',
                                          'KAYSERI',
                                          'KAZAN',
                                          'KECSKEMET',
                                          'KEDIRI',
                                          'KENITRA',
                                          'KHARKIV',
                                          'KHMELNYTSKYI',
                                          'KHON_KAEN',
                                          'KIELCE',
                                          'KIGALI',
                                          'KINGSTON',
                                          'KIRKLARELI',
                                          'KISSIMMEE',
                                          'KITCHENER',
                                          'KLAIPEDA',
                                          'KNOXVILLE',
                                          'KOCHI',
                                          'KOLKATA',
                                          'KOLLAM',
                                          'KONYA',
                                          'KOSEKOY',
                                          'KOSICE',
                                          'KOTA_KINABALU',
                                          'KOZHIKODE',
                                          'KRAKOW',
                                          'KRASNODAR',
                                          'KRYVYI_RIH',
                                          'KUALA_LUMPUR',
                                          'KUCHING',
                                          'KUTAHYA',
                                          'KUTAISI',
                                          'KUWAIT_CITY',
                                          'KYIV',
                                          'LA_PAZ',
                                          'LA_PLATA',
                                          'LA_RIOJA',
                                          'LA_SERENA',
                                          'LAFAYETTE',
                                          'LAFERRERE',
                                          'LAGES',
                                          'LAGOS',
                                          'LAHORE',
                                          'LAHUG',
                                          'LAKE_WORTH',
                                          'LAKELAND',
                                          'LANCASTER',
                                          'LANUS',
                                          'LAS_PALMAS DE GRAN CANARIA',
                                          'LAS_PINAS',
                                          'LAS_VEGAS',
                                          'LAUSANNE',
                                          'LAVAL',
                                          'LAWRENCEVILLE',
                                          'LE_MANS',
                                          'LEEDS',
                                          'LEICESTER',
                                          'LEIPZIG',
                                          'LEON',
                                          'LEXINGTON',
                                          'LIBREVILLE',
                                          'LIEGE',
                                          'LILLE',
                                          'LIMA',
                                          'LIMASSOL',
                                          'LIMEIRA',
                                          'LINCOLN',
                                          'LINHARES',
                                          'LIPA_CITY',
                                          'LISBON',
                                          'LIVERPOOL',
                                          'LJUBLJANA',
                                          'LODZ',
                                          'LOJA',
                                          'LOMAS_DE ZAMORA',
                                          'LOME',
                                          'LONDRINA',
                                          'LONG_BEACH',
                                          'LONGUEUIL',
                                          'LOUISVILLE',
                                          'LUANDA',
                                          'LUBLIN',
                                          'LUCENA_CITY',
                                          'LUCKNOW',
                                          'LUDHIANA',
                                          'LUSAKA',
                                          'LUXEMBOURG',
                                          'LUZIANIA',
                                          'LVIV',
                                          'LYON',
                                          'MABALACAT',
                                          'MACAE',
                                          'MACAO',
                                          'MACAPA',
                                          'MACEIO',
                                          'MACHALA',
                                          'MADISON',
                                          'MADRID',
                                          'MAGE',
                                          'MAGELANG',
                                          'MAGNESIA_AD SIPYLUM',
                                          'MAKASSAR',
                                          'MAKATI_CITY',
                                          'MALABON',
                                          'MALAGA',
                                          'MALANG',
                                          'MALAPPURAM',
                                          'MALDONADO',
                                          'MALE',
                                          'MALMO',
                                          'MANADO',
                                          'MANAGUA',
                                          'MANAMA',
                                          'MANAUS',
                                          'MANCHESTER',
                                          'MANDALUYONG_CITY',
                                          'MANILA',
                                          'MANIZALES',
                                          'MANNHEIM',
                                          'MAPUTO',
                                          'MAR_DEL PLATA',
                                          'MARABA',
                                          'MARACAIBO',
                                          'MARACANAU',
                                          'MARACAY',
                                          'MARDIN',
                                          'MARIBOR',
                                          'MARICA',
                                          'MARIETTA',
                                          'MARIKINA_CITY',
                                          'MARILIA',
                                          'MARINGA',
                                          'MARRAKESH',
                                          'MARSEILLE',
                                          'MAUA',
                                          'MAZATLAN',
                                          'MEDAN',
                                          'MEDELLIN',
                                          'MEDINA',
                                          'MEERUT',
                                          'MEKNES',
                                          'MELBOURNE',
                                          'MEMPHIS',
                                          'MENDOZA',
                                          'MERIDA',
                                          'MERKEZ',
                                          'MERLO',
                                          'MERSIN',
                                          'MESA',
                                          'MEXICALI',
                                          'MEXICO_CITY',
                                          'MILAN',
                                          'MILTON_KEYNES',
                                          'MILWAUKEE',
                                          'MINNEAPOLIS',
                                          'MINSK',
                                          'MISKOLC',
                                          'MISSISSAUGA',
                                          'MOGI_DAS CRUZES',
                                          'MOHALI',
                                          'MONROE',
                                          'MONTE_GRANDE',
                                          'MONTEGO_BAY',
                                          'MONTERREY',
                                          'MONTES_CLAROS',
                                          'MONTEVIDEO',
                                          'MONTGOMERY',
                                          'MONTPELLIER',
                                          'MONTREAL',
                                          'MORELIA',
                                          'MORENO',
                                          'MORON',
                                          'MOSSORO',
                                          'MUGLA',
                                          'MULTAN',
                                          'MUMBAI',
                                          'MUNICH',
                                          'MURCIA',
                                          'MUSCAT',
                                          'MUZAFFARGARH',
                                          'MYKOLAYIV',
                                          'NAALDWIJK',
                                          'NAGA',
                                          'NAGPUR',
                                          'NAIROBI',
                                          'NANTES',
                                          'NAPLES',
                                          'NASHVILLE',
                                          'NASSAU',
                                          'NASUGBU',
                                          'NATAL',
                                          'NAUCALPAN',
                                          'NAVI_MUMBAI',
                                          'NEIVA',
                                          'NEUQUEN',
                                          'NEVSEHIR',
                                          'NEW_DELHI',
                                          'NEW_ORLEANS',
                                          'NEW_TAIPEI',
                                          'NEWARK',
                                          'NEWCASTLE_UPON TYNE',
                                          'NHA_TRANG',
                                          'NICE',
                                          'NICOSIA',
                                          'NILOPOLIS',
                                          'NIS',
                                          'NITEROI',
                                          'NITRA',
                                          'NIZHNIY_NOVGOROD',
                                          'NOGALES',
                                          'NOIDA',
                                          'NORTHAMPTON',
                                          'NORWICH',
                                          'NOTTINGHAM',
                                          'NOVA_FRIBURGO',
                                          'NOVA_IGUACU',
                                          'NOVI_SAD',
                                          'NOVO_HAMBURGO',
                                          'NOVOSIBIRSK',
                                          'NUREMBERG',
                                          'OAKLAND',
                                          'OAXACA_CITY',
                                          'ODESA',
                                          'OKLAHOMA_CITY',
                                          'OLINDA',
                                          'OLOMOUC',
                                          'OLONGAPO_CITY',
                                          'OLSZTYN',
                                          'OMAHA',
                                          'ORADEA',
                                          'ORAN',
                                          'ORDU',
                                          'ORLANDO',
                                          'OSASCO',
                                          'OSLO',
                                          'OSMANIYE',
                                          'OSTRAVA',
                                          'OTTAWA',
                                          'OUJDA',
                                          'OURINHOS',
                                          'PACHUCA',
                                          'PADOVA',
                                          'PALAKKAD',
                                          'PALEMBANG',
                                          'PALERMO',
                                          'PALHOCA',
                                          'PALMA',
                                          'PALMAS',
                                          'PANAMA_CITY',
                                          'PARAMARIBO',
                                          'PARANA',
                                          'PARANAGUA',
                                          'PARANAQUE_CITY',
                                          'PARAUAPEBAS',
                                          'PARIS',
                                          'PARNAIBA',
                                          'PARNAMIRIM',
                                          'PASSO_FUNDO',
                                          'PASTO',
                                          'PATAN',
                                          'PATNA',
                                          'PATOS_DE MINAS',
                                          'PAULISTA',
                                          'PECS',
                                          'PEKANBARU',
                                          'PELOTAS',
                                          'PEORIA',
                                          'PEREIRA',
                                          'PERM',
                                          'PERTH',
                                          'PESCARA',
                                          'PESHAWAR',
                                          'PETAH_TIKVA',
                                          'PETALING_JAYA',
                                          'PETROLINA',
                                          'PETROPOLIS',
                                          'PHILADELPHIA',
                                          'PHNOM_PENH',
                                          'PHOENIX',
                                          'PILAR',
                                          'PINDAMONHANGABA',
                                          'PIRACICABA',
                                          'PITESTI',
                                          'PITTSBURGH',
                                          'PIURA',
                                          'PLANO',
                                          'PLOIESTI',
                                          'PLOVDIV',
                                          'PLYMOUTH',
                                          'POCOS_DE CALDAS',
                                          'PODGORICA',
                                          'POLTAVA',
                                          'PONTA_GROSSA',
                                          'PONTIANAK',
                                          'POPAYAN',
                                          'PORT_AU PRINCE',
                                          'PORT_ELIZABETH',
                                          'PORT_HARCOURT',
                                          'PORT_LOUIS',
                                          'PORT_MONTT',
                                          'PORT_OF SPAIN',
                                          'PORT_SAID',
                                          'PORTLAND',
                                          'PORTO',
                                          'PORTO_ALEGRE',
                                          'PORTO_SEGURO',
                                          'PORTO_VELHO',
                                          'PORTOVIEJO',
                                          'POSADAS',
                                          'POUSO_ALEGRE',
                                          'POZNAN',
                                          'PRAGUE',
                                          'PRAIA_GRANDE',
                                          'PRESIDENTE_PRUDENTE',
                                          'PRETORIA',
                                          'PRISTINA',
                                          'PROVIDENCE',
                                          'PUCALLPA',
                                          'PUCHONG_BATU DUA BELAS',
                                          'PUEBLA_CITY',
                                          'PUNE',
                                          'QUEBEC',
                                          'QUEENS',
                                          'QUEIMADOS',
                                          'QUERETARO_CITY',
                                          'QUEZON_CITY',
                                          'QUILMES',
                                          'QUITO',
                                          'RABAT',
                                          'RAIPUR',
                                          'RAJKOT',
                                          'RAJSHAHI',
                                          'RALEIGH',
                                          'RAMAT_GAN',
                                          'RANCAGUA',
                                          'RANCHI',
                                          'RAS_AL KHAIMAH',
                                          'RAWALPINDI',
                                          'READING',
                                          'RECIFE',
                                          'REGINA',
                                          'RENNES',
                                          'RENO',
                                          'RESISTENCIA',
                                          'REYKJAVIK',
                                          'REYNOSA',
                                          'RIBEIRAO_DAS NEVES',
                                          'RIBEIRAO_PRETO',
                                          'RICHMOND',
                                          'RIGA',
                                          'RIO_BRANCO',
                                          'RIO_CLARO',
                                          'RIO_CUARTO',
                                          'RIO_DE JANEIRO',
                                          'RIO_DO SUL',
                                          'RIO_GALLEGOS',
                                          'RIO_GRANDE',
                                          'RISHON_LETSIYYON',
                                          'RIVERSIDE',
                                          'RIYADH',
                                          'RIZE',
                                          'ROCHESTER',
                                          'ROME',
                                          'RONDONOPOLIS',
                                          'ROSARIO',
                                          'ROSEAU',
                                          'ROSTOV_ON DON',
                                          'ROTTERDAM',
                                          'ROUEN',
                                          'ROUSSE',
                                          'RZESZOW',
                                          'SACRAMENTO',
                                          'SAGAR',
                                          'SAINT_PAUL',
                                          'SALE',
                                          'SALT_LAKE CITY',
                                          'SALTA',
                                          'SALTILLO',
                                          'SALVADOR',
                                          'SAMARA',
                                          'SAMARINDA',
                                          'SAMARKAND',
                                          'SAMSUN',
                                          'SAN_ANTONIO',
                                          'SAN_DIEGO',
                                          'SAN_FERNANDO',
                                          'SAN_FRANCISCO',
                                          'SAN_JOSE',
                                          'SAN_JOSE DEL MONTE',
                                          'SAN_JUAN',
                                          'SAN_JUSTO',
                                          'SAN_LUIS',
                                          'SAN_LUIS POTOSI CITY',
                                          'SAN_MIGUEL',
                                          'SAN_MIGUEL DE TUCUMAN',
                                          'SAN_PABLO CITY',
                                          'SAN_PEDRO',
                                          'SAN_PEDRO SULA',
                                          'SAN_SALVADOR',
                                          'SAN_SALVADOR DE JUJUY',
                                          'SANAA',
                                          'SANLIURFA',
                                          'SANTA_CRUZ',
                                          'SANTA_CRUZ DE TENERIFE',
                                          'SANTA_CRUZ DO SUL',
                                          'SANTA_FE',
                                          'SANTA_LUZIA',
                                          'SANTA_MARIA',
                                          'SANTA_MARTA',
                                          'SANTA_ROSA',
                                          'SANTAREM',
                                          'SANTIAGO',
                                          'SANTIAGO_DE CALI',
                                          'SANTIAGO_DE LOS CABALLEROS',
                                          'SANTO_ANDRE',
                                          'SANTO_DOMINGO',
                                          'SANTO_DOMINGO ESTE',
                                          'SANTOS',
                                          'SAO_BERNARDO DO CAMPO',
                                          'SAO_CARLOS',
                                          'SAO_GONCALO',
                                          'SAO_JOAO DE MERITI',
                                          'SAO_JOSE',
                                          'SAO_JOSE DO RIO PRETO',
                                          'SAO_JOSE DOS CAMPOS',
                                          'SAO_JOSE DOS PINHAIS',
                                          'SAO_LEOPOLDO',
                                          'SAO_LUIS',
                                          'SAO_PAULO',
                                          'SAO_VICENTE',
                                          'SARAJEVO',
                                          'SASKATOON',
                                          'SCARBOROUGH',
                                          'SEATTLE',
                                          'SEMARANG',
                                          'SEO_GU',
                                          'SEONGNAM_SI',
                                          'SEOUL',
                                          'SERRA',
                                          'SETE_LAGOAS',
                                          'SETIF',
                                          'SETUBAL',
                                          'SEVILLE',
                                          'SFAX',
                                          'SHAH_ALAM',
                                          'SHANGHAI',
                                          'SHARJAH',
                                          'SHEFFIELD',
                                          'SHENZHEN',
                                          'SHIMLA',
                                          'SIAULIAI',
                                          'SIBIU',
                                          'SIDOARJO',
                                          'SIKAR',
                                          'SILVER_SPRING',
                                          'SINOP',
                                          'SIVAS',
                                          'SKIKDA',
                                          'SKOPJE',
                                          'SLOUGH',
                                          'SOBRAL',
                                          'SOFIA',
                                          'SOROCABA',
                                          'SOUSSE',
                                          'SOUTH_TANGERANG',
                                          'SOUTHAMPTON',
                                          'SOUTHWARK',
                                          'SPLIT',
                                          'SPOKANE',
                                          'SPRING',
                                          'SPRINGFIELD',
                                          'ST_LOUIS',
                                          'ST_PETERSBURG',
                                          'STARA_ZAGORA',
                                          'STATEN_ISLAND',
                                          'STOCKHOLM',
                                          'STOCKTON',
                                          'STOKE_ON TRENT',
                                          'STRASBOURG',
                                          'STUTTGART',
                                          'SUMARE',
                                          'SURABAYA',
                                          'SURAKARTA',
                                          'SURAT',
                                          'SURREY',
                                          'SUWON',
                                          'SUZANO',
                                          'SYDNEY',
                                          'SZCZECIN',
                                          'SZEGED',
                                          'SZEKESFEHERVAR',
                                          'TABOAO_DA SERRA',
                                          'TACNA',
                                          'TACOMA',
                                          'TAGUIG',
                                          'TAICHUNG',
                                          'TAINAN_CITY',
                                          'TAIPEI',
                                          'TALAVERA',
                                          'TALCA',
                                          'TALLAHASSEE',
                                          'TALLINN',
                                          'TAMPA',
                                          'TAMPERE',
                                          'TAMPICO',
                                          'TANGERANG',
                                          'TANGIER',
                                          'TANTA',
                                          'TANZA',
                                          'TAOYUAN_DISTRICT',
                                          'TAPPAHANNOCK',
                                          'TARLAC_CITY',
                                          'TASHKENT',
                                          'TASIKMALAYA',
                                          'TATUI',
                                          'TAUBATE',
                                          'TBILISI',
                                          'TEGUCIGALPA',
                                          'TEHRAN',
                                          'TEIXEIRA_DE FREITAS',
                                          'TEKIRDAG',
                                          'TEL_AVIV',
                                          'TEMUCO',
                                          'TEPIC',
                                          'TERESINA',
                                          'TERNOPIL',
                                          'TERRASSA',
                                          'TETOUAN',
                                          'THANE',
                                          'THE_BRONX',
                                          'THE_HAGUE',
                                          'THESSALONIKI',
                                          'THIRUVANANTHAPURAM',
                                          'THRISSUR',
                                          'TIJUANA',
                                          'TIMISOARA',
                                          'TIRANA',
                                          'TLALNEPANTLA',
                                          'TLAXCALA_CITY',
                                          'TLEMCEN',
                                          'TOKAT_PROVINCE',
                                          'TOKYO',
                                          'TOLUCA',
                                          'TORONTO',
                                          'TORREON',
                                          'TOULOUSE',
                                          'TRABZON',
                                          'TRUJILLO',
                                          'TUBARAO',
                                          'TUCSON',
                                          'TUGUEGARAO_CITY',
                                          'TULSA',
                                          'TUNIS',
                                          'TUNJA',
                                          'TURIN',
                                          'TUXTLA_GUTIERREZ',
                                          'TUZLA',
                                          'UBERABA',
                                          'UBERLANDIA',
                                          'UFA',
                                          'ULAN_BATOR',
                                          'UMEDA',
                                          'URDANETA',
                                          'USAK',
                                          'VADODARA',
                                          'VALENCIA',
                                          'VALINHOS',
                                          'VALLADOLID',
                                          'VALLEDUPAR',
                                          'VALPARAISO',
                                          'VALPARAISO_DE GOIAS',
                                          'VAN',
                                          'VANCOUVER',
                                          'VARANASI',
                                          'VARGINHA',
                                          'VARNA',
                                          'VARZEA_PAULISTA',
                                          'VENUSTIANO_CARRANZA',
                                          'VERACRUZ',
                                          'VERONA',
                                          'VIAMAO',
                                          'VICTORIA',
                                          'VIENNA',
                                          'VIENTIANE',
                                          'VIGO',
                                          'VIJAYAWADA',
                                          'VILA_NOVA DE GAIA',
                                          'VILA_VELHA',
                                          'VILLA_BALLESTER',
                                          'VILLAVICENCIO',
                                          'VILNIUS',
                                          'VINA_DEL MAR',
                                          'VINNYTSIA',
                                          'VIRGINIA_BEACH',
                                          'VISAKHAPATNAM',
                                          'VITORIA',
                                          'VITORIA_DA CONQUISTA',
                                          'VITORIA_DE SANTO ANTAO',
                                          'VOLTA_REDONDA',
                                          'VORONEZH',
                                          'WARSAW',
                                          'WASHINGTON',
                                          'WELLINGTON',
                                          'WEST_PALM BEACH',
                                          'WICHITA',
                                          'WILLEMSTAD',
                                          'WILMINGTON',
                                          'WINDHOEK',
                                          'WINDSOR',
                                          'WINNIPEG',
                                          'WOLVERHAMPTON',
                                          'WOODBRIDGE',
                                          'WROCLAW',
                                          'WUPPERTAL',
                                          'XALAPA',
                                          'YALOVA',
                                          'YANGON',
                                          'YEKATERINBURG',
                                          'YEREVAN',
                                          'YOGYAKARTA',
                                          'YOKOHAMA',
                                          'YONGIN_SI',
                                          'ZABRZE',
                                          'ZAGAZIG',
                                          'ZAGREB',
                                          'ZAMBOANGA_CITY',
                                          'ZAPOPAN',
                                          'ZAPORIZHZHYA',
                                          'ZARAGOZA',
                                          'ZHONGLI_DISTRICT',
                                          'ZIELONA_GORA',
                                          'ZONGULDAK',
                                          'ZURICH',
                                        ],
                                        description: "City name (e.g., 'NEW_YORK', 'LOS_ANGELES')",
                                      },
                                      state: {
                                        type: 'string',
                                        enum: [
                                          'AL',
                                          'AK',
                                          'AZ',
                                          'AR',
                                          'CA',
                                          'CO',
                                          'CT',
                                          'DE',
                                          'FL',
                                          'GA',
                                          'HI',
                                          'ID',
                                          'IL',
                                          'IN',
                                          'IA',
                                          'KS',
                                          'KY',
                                          'LA',
                                          'ME',
                                          'MD',
                                          'MA',
                                          'MI',
                                          'MN',
                                          'MS',
                                          'MO',
                                          'MT',
                                          'NE',
                                          'NV',
                                          'NH',
                                          'NJ',
                                          'NM',
                                          'NY',
                                          'NC',
                                          'ND',
                                          'OH',
                                          'OK',
                                          'OR',
                                          'PA',
                                          'RI',
                                          'SC',
                                          'SD',
                                          'TN',
                                          'TX',
                                          'UT',
                                          'VT',
                                          'VA',
                                          'WA',
                                          'WV',
                                          'WI',
                                          'WY',
                                          'DC',
                                          'PR',
                                          'GU',
                                          'VI',
                                        ],
                                        description:
                                          "State code (e.g., 'NY', 'CA') - US states only",
                                      },
                                      country: {
                                        type: 'string',
                                        enum: [
                                          'US',
                                          'CA',
                                          'MX',
                                          'GB',
                                          'DE',
                                          'FR',
                                          'IT',
                                          'ES',
                                          'PL',
                                          'NL',
                                          'SE',
                                          'NO',
                                          'DK',
                                          'FI',
                                          'CH',
                                          'AT',
                                          'BE',
                                          'IE',
                                          'PT',
                                          'GR',
                                          'CZ',
                                          'HU',
                                          'RO',
                                          'BG',
                                          'SK',
                                          'SI',
                                          'HR',
                                          'EE',
                                          'LV',
                                          'LT',
                                          'LU',
                                          'MT',
                                          'CY',
                                          'IS',
                                          'LI',
                                          'MC',
                                          'SM',
                                          'VA',
                                          'JP',
                                          'KR',
                                          'CN',
                                          'HK',
                                          'TW',
                                          'SG',
                                          'AU',
                                          'NZ',
                                          'IN',
                                          'TH',
                                          'MY',
                                          'PH',
                                          'ID',
                                          'VN',
                                          'AF',
                                          'BD',
                                          'BN',
                                          'KH',
                                          'LA',
                                          'LK',
                                          'MM',
                                          'NP',
                                          'PK',
                                          'FJ',
                                          'PG',
                                          'AE',
                                          'SA',
                                          'IL',
                                          'TR',
                                          'IR',
                                          'IQ',
                                          'JO',
                                          'KW',
                                          'LB',
                                          'OM',
                                          'QA',
                                          'BH',
                                          'YE',
                                          'SY',
                                          'ZA',
                                          'EG',
                                          'MA',
                                          'NG',
                                          'KE',
                                          'DZ',
                                          'AO',
                                          'BW',
                                          'ET',
                                          'GH',
                                          'CI',
                                          'LY',
                                          'MZ',
                                          'RW',
                                          'SN',
                                          'TN',
                                          'UG',
                                          'ZM',
                                          'ZW',
                                          'TZ',
                                          'MU',
                                          'SC',
                                          'BR',
                                          'AR',
                                          'CL',
                                          'CO',
                                          'PE',
                                          'VE',
                                          'EC',
                                          'UY',
                                          'PY',
                                          'BO',
                                          'CR',
                                          'CU',
                                          'DO',
                                          'GT',
                                          'HN',
                                          'JM',
                                          'NI',
                                          'PA',
                                          'SV',
                                          'TT',
                                          'BB',
                                          'BZ',
                                          'GY',
                                          'SR',
                                          'RU',
                                          'UA',
                                          'BY',
                                          'KZ',
                                          'UZ',
                                          'AZ',
                                          'GE',
                                          'AM',
                                          'MD',
                                          'MK',
                                          'AL',
                                          'BA',
                                          'RS',
                                          'ME',
                                          'XK',
                                          'MN',
                                          'KG',
                                          'TJ',
                                          'TM',
                                        ],
                                        description:
                                          "Country code (e.g., 'US', 'GB', 'DE') - ISO 3166-1 alpha-2",
                                      },
                                    },
                                    required: ['country'],
                                    additionalProperties: false,
                                    description: 'Geographic location for the proxy',
                                  },
                                },
                                required: ['geolocation'],
                                additionalProperties: false,
                              },
                              {
                                type: 'object',
                                properties: {
                                  server: {
                                    type: 'string',
                                    description: 'Proxy server URL',
                                  },
                                },
                                required: ['server'],
                                additionalProperties: false,
                              },
                            ],
                            description: 'Array of proxy configurations with routing',
                          },
                        ],
                      },
                    ],
                    description:
                      'Proxy configuration for the session. Can be a boolean or array of proxy configurations',
                  },
                  {},
                ],
                description:
                  'Proxy configuration for the session. Can be a boolean or array of proxy configurations',
              },
              proxyUrl: {
                type: 'string',
                format: 'uri',
                description:
                  'Custom proxy URL for the browser session. Overrides useProxy, disabling Steel-provided proxies in favor of your specified proxy. Format: http(s)://username:password@hostname:port',
              },
              blockAds: {
                type: 'boolean',
                description: 'Block ads in the browser session. Default is false.',
              },
              solveCaptcha: {
                type: 'boolean',
                description: 'Enable automatic captcha solving. Default is false.',
              },
              sessionContext: {
                type: 'object',
                properties: {
                  cookies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                          description: 'The name of the cookie',
                        },
                        value: {
                          type: 'string',
                          description: 'The value of the cookie',
                        },
                        url: {
                          type: 'string',
                          description: 'The URL of the cookie',
                        },
                        domain: {
                          type: 'string',
                          description: 'The domain of the cookie',
                        },
                        path: {
                          type: 'string',
                          description: 'The path of the cookie',
                        },
                        secure: {
                          type: 'boolean',
                          description: 'Whether the cookie is secure',
                        },
                        httpOnly: {
                          type: 'boolean',
                          description: 'Whether the cookie is HTTP only',
                        },
                        sameSite: {
                          type: 'string',
                          enum: ['Strict', 'Lax', 'None'],
                          description: 'The same site attribute of the cookie',
                        },
                        size: {
                          type: 'number',
                          description: 'The size of the cookie',
                        },
                        expires: {
                          type: 'number',
                          description: 'The expiration date of the cookie',
                        },
                        partitionKey: {
                          type: 'object',
                          properties: {
                            topLevelSite: {
                              type: 'string',
                              description:
                                'The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie.',
                            },
                            hasCrossSiteAncestor: {
                              type: 'boolean',
                              description:
                                'Indicates if the cookie has any ancestors that are cross-site to the topLevelSite.',
                            },
                          },
                          required: ['topLevelSite', 'hasCrossSiteAncestor'],
                          additionalProperties: false,
                          description: 'The partition key of the cookie',
                        },
                        session: {
                          type: 'boolean',
                          description: 'Whether the cookie is a session cookie',
                        },
                        priority: {
                          type: 'string',
                          enum: ['Low', 'Medium', 'High'],
                          description: 'The priority of the cookie',
                        },
                        sameParty: {
                          type: 'boolean',
                          description: 'Whether the cookie is a same party cookie',
                        },
                        sourceScheme: {
                          type: 'string',
                          enum: ['Unset', 'NonSecure', 'Secure'],
                          description: 'The source scheme of the cookie',
                        },
                        sourcePort: {
                          type: 'number',
                          description: 'The source port of the cookie',
                        },
                      },
                      required: ['name', 'value'],
                      additionalProperties: false,
                    },
                    description: 'Cookies to initialize in the session',
                  },
                  localStorage: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      additionalProperties: {
                        type: 'string',
                      },
                    },
                    description: 'Domain-specific localStorage items to initialize in the session',
                  },
                  sessionStorage: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      additionalProperties: {
                        type: 'string',
                      },
                    },
                    description:
                      'Domain-specific sessionStorage items to initialize in the session',
                  },
                  indexedDB: {
                    type: 'object',
                    additionalProperties: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'number',
                          },
                          name: {
                            type: 'string',
                          },
                          data: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: {
                                  type: 'number',
                                },
                                name: {
                                  type: 'string',
                                },
                                records: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      key: {},
                                      value: {},
                                      blobFiles: {
                                        type: 'array',
                                        items: {
                                          type: 'object',
                                          properties: {
                                            blobNumber: {
                                              type: 'number',
                                            },
                                            mimeType: {
                                              type: 'string',
                                            },
                                            size: {
                                              type: 'number',
                                            },
                                            filename: {
                                              type: 'string',
                                            },
                                            lastModified: {
                                              type: 'string',
                                              format: 'date-time',
                                            },
                                            path: {
                                              type: 'string',
                                            },
                                          },
                                          required: ['blobNumber', 'mimeType', 'size'],
                                          additionalProperties: false,
                                        },
                                      },
                                    },
                                    additionalProperties: false,
                                  },
                                },
                              },
                              required: ['id', 'name', 'records'],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ['id', 'name', 'data'],
                        additionalProperties: false,
                      },
                    },
                    description: 'Domain-specific indexedDB items to initialize in the session',
                  },
                },
                additionalProperties: false,
                description:
                  'Session context data to be used in the created session. Sessions will start with an empty context by default.',
              },
              timeout: {
                type: 'integer',
                description:
                  'Session timeout duration in milliseconds. Default is 300000 (5 minutes).',
              },
              concurrency: {
                type: 'integer',
                description: 'Number of sessions to create concurrently (check your plan limit)',
              },
              isSelenium: {
                type: 'boolean',
                description:
                  'Enable Selenium mode for the browser session (default is false). Use this when you plan to connect to the browser session via Selenium.',
              },
              dimensions: {
                type: 'object',
                properties: {
                  width: {
                    type: 'integer',
                    description: 'Width of the session',
                  },
                  height: {
                    type: 'integer',
                    description: 'Height of the session',
                  },
                },
                required: ['width', 'height'],
                additionalProperties: false,
                description: 'Viewport and browser window dimensions for the session',
              },
              namespace: {
                type: 'string',
                description:
                  'The namespace the session should be created against. Defaults to "default".',
              },
              credentials: {
                type: 'object',
                properties: {
                  autoSubmit: {
                    type: 'boolean',
                  },
                  blurFields: {
                    type: 'boolean',
                  },
                  exactOrigin: {
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
                description: 'Configuration for session credentials',
              },
              region: {
                type: 'string',
                enum: ['lax', 'ord', 'iad', 'bom', 'scl', 'fra', 'hkg'],
                description: 'The desired region for the session to be started in',
              },
              stealthConfig: {
                type: 'object',
                properties: {
                  humanizeInteractions: {
                    type: 'boolean',
                    description:
                      'This flag will make the browser act more human-like by moving the mouse in a more natural way.',
                  },
                  skipFingerprintInjection: {
                    type: 'boolean',
                    description: 'This flag will skip the fingerprint generation for the session.',
                  },
                },
                additionalProperties: false,
                description: 'Stealth configuration for the session',
              },
              extensionIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description:
                  "Array of extension IDs to install in the session. Use ['all_ext'] to install all uploaded extensions.",
              },
            },
            additionalProperties: false,
          },
          GetSessionLogsResponse: {
            title: 'getSessionLogsResponse',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                },
                log: {
                  type: 'string',
                },
                id: {
                  type: 'string',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
              required: ['type', 'log', 'id', 'timestamp'],
              additionalProperties: false,
            },
            description: 'Logs for a browser session',
          },
          GetSessionEventsResponse: {
            title: 'getSessionEventsResponse',
            type: 'array',
            description: 'Events for a browser session',
          },
          SessionsResponse: {
            title: 'sessionsResponse',
            type: 'object',
            properties: {
              sessions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                      description: 'Unique identifier for the session',
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Timestamp when the session started',
                    },
                    status: {
                      type: 'string',
                      enum: ['live', 'released', 'failed'],
                      description: 'Status of the session',
                    },
                    duration: {
                      type: 'integer',
                      description: 'Duration of the session in milliseconds',
                    },
                    eventCount: {
                      type: 'integer',
                      description: 'Number of events processed in the session',
                    },
                    timeout: {
                      type: 'integer',
                      description: 'Session timeout duration in milliseconds',
                    },
                    dimensions: {
                      type: 'object',
                      properties: {
                        width: {
                          type: 'integer',
                          description: 'Width of the browser window',
                        },
                        height: {
                          type: 'integer',
                          description: 'Height of the browser window',
                        },
                      },
                      required: ['width', 'height'],
                      additionalProperties: false,
                      description: 'Viewport and browser window dimensions for the session',
                    },
                    creditsUsed: {
                      type: 'integer',
                      description: 'Amount of credits consumed by the session',
                    },
                    websocketUrl: {
                      type: 'string',
                      description: "URL for the session's WebSocket connection",
                    },
                    debugUrl: {
                      type: 'string',
                      description: 'URL for debugging the session',
                    },
                    sessionViewerUrl: {
                      type: 'string',
                      description: 'URL to view session details',
                    },
                    userAgent: {
                      type: 'string',
                      description: 'User agent string used in the session',
                    },
                    proxySource: {
                      type: 'string',
                      enum: ['steel', 'external'],
                      nullable: true,
                      description: 'Source of the proxy used for the session',
                    },
                    proxyBytesUsed: {
                      type: 'integer',
                      minimum: 0,
                      description: 'Amount of data transmitted through the proxy',
                    },
                    solveCaptcha: {
                      type: 'boolean',
                      description: 'Indicates if captcha solving is enabled',
                    },
                    isSelenium: {
                      type: 'boolean',
                      description: 'Indicates if Selenium is used in the session',
                    },
                    stealthConfig: {
                      type: 'object',
                      properties: {
                        humanizeInteractions: {
                          type: 'boolean',
                          description:
                            'This flag will make the browser act more human-like by moving the mouse in a more natural way',
                        },
                        skipFingerprintInjection: {
                          type: 'boolean',
                          description:
                            'This flag will skip the fingerprint generation for the session.',
                        },
                      },
                      additionalProperties: false,
                      description: 'Stealth configuration for the session',
                    },
                    region: {
                      type: 'string',
                      enum: ['lax', 'ord', 'iad', 'bom', 'scl', 'fra', 'hkg'],
                      description: 'The region where the session was created',
                    },
                  },
                  required: [
                    'id',
                    'createdAt',
                    'status',
                    'duration',
                    'eventCount',
                    'timeout',
                    'dimensions',
                    'creditsUsed',
                    'websocketUrl',
                    'debugUrl',
                    'sessionViewerUrl',
                    'proxySource',
                    'proxyBytesUsed',
                  ],
                  additionalProperties: false,
                  description:
                    'Represents the data structure for a browser session, including its configuration and status.',
                },
                description: 'List of browser sessions',
              },
            },
            required: ['sessions'],
            additionalProperties: false,
            description: 'Response containing a list of browser sessions with pagination details.',
          },
          SessionResponse: {
            title: 'sessionResponse',
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'Unique identifier for the session',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Timestamp when the session started',
              },
              status: {
                type: 'string',
                enum: ['live', 'released', 'failed'],
                description: 'Status of the session',
              },
              duration: {
                type: 'integer',
                description: 'Duration of the session in milliseconds',
              },
              eventCount: {
                type: 'integer',
                description: 'Number of events processed in the session',
              },
              timeout: {
                type: 'integer',
                description: 'Session timeout duration in milliseconds',
              },
              dimensions: {
                type: 'object',
                properties: {
                  width: {
                    type: 'integer',
                    description: 'Width of the browser window',
                  },
                  height: {
                    type: 'integer',
                    description: 'Height of the browser window',
                  },
                },
                required: ['width', 'height'],
                additionalProperties: false,
                description: 'Viewport and browser window dimensions for the session',
              },
              creditsUsed: {
                type: 'integer',
                description: 'Amount of credits consumed by the session',
              },
              websocketUrl: {
                type: 'string',
                description: "URL for the session's WebSocket connection",
              },
              debugUrl: {
                type: 'string',
                description: 'URL for debugging the session',
              },
              sessionViewerUrl: {
                type: 'string',
                description: 'URL to view session details',
              },
              userAgent: {
                type: 'string',
                description: 'User agent string used in the session',
              },
              proxySource: {
                type: 'string',
                enum: ['steel', 'external'],
                nullable: true,
                description: 'Source of the proxy used for the session',
              },
              proxyBytesUsed: {
                type: 'integer',
                minimum: 0,
                description: 'Amount of data transmitted through the proxy',
              },
              solveCaptcha: {
                type: 'boolean',
                description: 'Indicates if captcha solving is enabled',
              },
              isSelenium: {
                type: 'boolean',
                description: 'Indicates if Selenium is used in the session',
              },
              stealthConfig: {
                type: 'object',
                properties: {
                  humanizeInteractions: {
                    type: 'boolean',
                    description:
                      'This flag will make the browser act more human-like by moving the mouse in a more natural way',
                  },
                  skipFingerprintInjection: {
                    type: 'boolean',
                    description: 'This flag will skip the fingerprint generation for the session.',
                  },
                },
                additionalProperties: false,
                description: 'Stealth configuration for the session',
              },
              region: {
                type: 'string',
                enum: ['lax', 'ord', 'iad', 'bom', 'scl', 'fra', 'hkg'],
                description: 'The region where the session was created',
              },
            },
            required: [
              'id',
              'createdAt',
              'status',
              'duration',
              'eventCount',
              'timeout',
              'dimensions',
              'creditsUsed',
              'websocketUrl',
              'debugUrl',
              'sessionViewerUrl',
              'proxySource',
              'proxyBytesUsed',
            ],
            additionalProperties: false,
            description:
              'Represents the data structure for a browser session, including its configuration and status.',
          },
          ReleaseSessionResponse: {
            title: 'releaseSessionResponse',
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                description: 'Indicates if the session was successfully released',
              },
              message: {
                type: 'string',
                description: 'Details about the outcome of the release operation',
              },
            },
            required: ['success', 'message'],
            additionalProperties: false,
            description: 'Response for releasing a single session.',
          },
          ReleaseSessionsResponse: {
            title: 'releaseSessionsResponse',
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                description: 'Indicates if the sessions were successfully released',
              },
              message: {
                type: 'string',
                description: 'Details about the outcome of the release operation',
              },
            },
            required: ['success', 'message'],
            additionalProperties: false,
            description: 'Response for releasing multiple sessions.',
          },
          SessionContextResponse: {
            title: 'sessionContextResponse',
            type: 'object',
            properties: {
              cookies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'The name of the cookie',
                    },
                    value: {
                      type: 'string',
                      description: 'The value of the cookie',
                    },
                    url: {
                      type: 'string',
                      description: 'The URL of the cookie',
                    },
                    domain: {
                      type: 'string',
                      description: 'The domain of the cookie',
                    },
                    path: {
                      type: 'string',
                      description: 'The path of the cookie',
                    },
                    secure: {
                      type: 'boolean',
                      description: 'Whether the cookie is secure',
                    },
                    httpOnly: {
                      type: 'boolean',
                      description: 'Whether the cookie is HTTP only',
                    },
                    sameSite: {
                      type: 'string',
                      enum: ['Strict', 'Lax', 'None'],
                      description: 'The same site attribute of the cookie',
                    },
                    size: {
                      type: 'number',
                      description: 'The size of the cookie',
                    },
                    expires: {
                      type: 'number',
                      description: 'The expiration date of the cookie',
                    },
                    partitionKey: {
                      type: 'object',
                      properties: {
                        topLevelSite: {
                          type: 'string',
                          description:
                            'The site of the top-level URL the browser was visiting at the start of the request to the endpoint that set the cookie.',
                        },
                        hasCrossSiteAncestor: {
                          type: 'boolean',
                          description:
                            'Indicates if the cookie has any ancestors that are cross-site to the topLevelSite.',
                        },
                      },
                      required: ['topLevelSite', 'hasCrossSiteAncestor'],
                      additionalProperties: false,
                      description: 'The partition key of the cookie',
                    },
                    session: {
                      type: 'boolean',
                      description: 'Whether the cookie is a session cookie',
                    },
                    priority: {
                      type: 'string',
                      enum: ['Low', 'Medium', 'High'],
                      description: 'The priority of the cookie',
                    },
                    sameParty: {
                      type: 'boolean',
                      description: 'Whether the cookie is a same party cookie',
                    },
                    sourceScheme: {
                      type: 'string',
                      enum: ['Unset', 'NonSecure', 'Secure'],
                      description: 'The source scheme of the cookie',
                    },
                    sourcePort: {
                      type: 'number',
                      description: 'The source port of the cookie',
                    },
                  },
                  required: ['name', 'value'],
                  additionalProperties: false,
                },
                description: 'Cookies to initialize in the session',
              },
              localStorage: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
                description: 'Domain-specific localStorage items to initialize in the session',
              },
              sessionStorage: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  additionalProperties: {
                    type: 'string',
                  },
                },
                description: 'Domain-specific sessionStorage items to initialize in the session',
              },
              indexedDB: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'number',
                      },
                      name: {
                        type: 'string',
                      },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'number',
                            },
                            name: {
                              type: 'string',
                            },
                            records: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  key: {},
                                  value: {},
                                  blobFiles: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      properties: {
                                        blobNumber: {
                                          type: 'number',
                                        },
                                        mimeType: {
                                          type: 'string',
                                        },
                                        size: {
                                          type: 'number',
                                        },
                                        filename: {
                                          type: 'string',
                                        },
                                        lastModified: {
                                          type: 'string',
                                          format: 'date-time',
                                        },
                                        path: {
                                          type: 'string',
                                        },
                                      },
                                      required: ['blobNumber', 'mimeType', 'size'],
                                      additionalProperties: false,
                                    },
                                  },
                                },
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ['id', 'name', 'records'],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ['id', 'name', 'data'],
                    additionalProperties: false,
                  },
                },
                description: 'Domain-specific indexedDB items to initialize in the session',
              },
            },
            additionalProperties: false,
            description: 'Session context data returned from a browser session.',
          },
          SessionDebuggerResponse: {
            title: 'sessionDebuggerResponse',
            description: 'Chrome DevTools debugger for the browser session',
          },
          NullableRequest: {
            title: 'nullableRequest',
            type: 'object',
            properties: {},
            additionalProperties: false,
            nullable: true,
            description: 'Empty request body that can be null',
          },
          SessionPlayerQuery: {
            title: 'sessionPlayerQuery',
            type: 'object',
            properties: {
              showControls: {
                type: 'boolean',
                default: true,
                description: 'Show controls in the browser iframe',
              },
              theme: {
                type: 'string',
                enum: ['dark', 'light'],
                default: 'dark',
                description: 'Theme of the browser iframe',
              },
              interactive: {
                type: 'boolean',
                default: true,
                description: 'Make the browser iframe interactive',
              },
              pageId: {
                type: 'string',
                description: 'Page ID to connect to',
              },
              pageIndex: {
                type: 'string',
                description: 'Page index (or tab index) to connect to',
              },
            },
            additionalProperties: false,
          },
          SessionPlayerResponse: {
            title: 'sessionPlayerResponse',
            type: 'string',
            description: 'HTML content with rrweb player for the browser session',
          },
          SessionLiveDetailsResponse: {
            title: 'sessionLiveDetailsResponse',
            type: 'object',
            properties: {
              sessionViewerUrl: {
                type: 'string',
              },
              sessionViewerFullscreenUrl: {
                type: 'string',
              },
              pages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                    },
                    url: {
                      type: 'string',
                    },
                    title: {
                      type: 'string',
                    },
                    favicon: {
                      type: 'string',
                      nullable: true,
                    },
                    sessionViewerUrl: {
                      type: 'string',
                    },
                    sessionViewerFullscreenUrl: {
                      type: 'string',
                    },
                  },
                  required: [
                    'id',
                    'url',
                    'title',
                    'favicon',
                    'sessionViewerUrl',
                    'sessionViewerFullscreenUrl',
                  ],
                  additionalProperties: false,
                },
              },
              wsUrl: {
                type: 'string',
              },
            },
            required: ['sessionViewerUrl', 'sessionViewerFullscreenUrl', 'pages', 'wsUrl'],
            additionalProperties: false,
          },
          SessionProxyResponse: {
            title: 'sessionProxyResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Status message about the proxy',
              },
              hasActiveProxy: {
                type: 'boolean',
                description: 'Whether the session has an active proxy',
              },
              proxyStatus: {
                type: 'object',
                properties: {
                  currentProxy: {
                    type: 'string',
                    description: 'Currently active proxy (masked for security)',
                  },
                  workingProxiesCount: {
                    type: 'integer',
                    description: 'Number of working proxy alternatives available',
                  },
                  testingProgress: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'integer',
                        description: 'Total number of proxies to test',
                      },
                      tested: {
                        type: 'integer',
                        description: 'Number of proxies already tested',
                      },
                      inProgress: {
                        type: 'integer',
                        description: 'Number of proxies currently being tested',
                      },
                    },
                    required: ['total', 'tested', 'inProgress'],
                    additionalProperties: false,
                    description: 'Progress information about proxy testing',
                  },
                  swapInProgress: {
                    type: 'boolean',
                    description: 'Whether a proxy swap is currently in progress',
                  },
                },
                required: [
                  'currentProxy',
                  'workingProxiesCount',
                  'testingProgress',
                  'swapInProgress',
                ],
                additionalProperties: false,
                description: 'Proxy status object with additional details',
                nullable: true,
              },
            },
            required: ['message', 'hasActiveProxy', 'proxyStatus'],
            additionalProperties: false,
            description: 'Response containing proxy status information for a session',
          },
          SessionProxySwapResponse: {
            title: 'sessionProxySwapResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Status message about the proxy swap operation',
              },
              proxyStatus: {
                type: 'object',
                properties: {
                  currentProxy: {
                    type: 'string',
                    description: 'Currently active proxy (masked for security)',
                  },
                  workingProxiesCount: {
                    type: 'integer',
                    description: 'Number of working proxy alternatives available',
                  },
                  testingProgress: {
                    type: 'object',
                    properties: {
                      total: {
                        type: 'integer',
                        description: 'Total number of proxies to test',
                      },
                      tested: {
                        type: 'integer',
                        description: 'Number of proxies already tested',
                      },
                      inProgress: {
                        type: 'integer',
                        description: 'Number of proxies currently being tested',
                      },
                    },
                    required: ['total', 'tested', 'inProgress'],
                    additionalProperties: false,
                    description: 'Progress information about proxy testing',
                  },
                  swapInProgress: {
                    type: 'boolean',
                    description: 'Whether a proxy swap is currently in progress',
                  },
                },
                required: [
                  'currentProxy',
                  'workingProxiesCount',
                  'testingProgress',
                  'swapInProgress',
                ],
                additionalProperties: false,
                description: 'Proxy status object with additional details',
                nullable: true,
              },
            },
            required: ['message', 'proxyStatus'],
            additionalProperties: false,
            description: 'Response containing proxy swap operation results',
          },
          ScrapeRequest: {
            title: 'scrapeRequest',
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL of the webpage to scrape',
              },
              format: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['html', 'readability', 'cleaned_html', 'markdown'],
                },
                description: 'Desired format(s) for the scraped content. Default is `html`.',
              },
              screenshot: {
                type: 'boolean',
                description: 'Include a screenshot in the response',
              },
              pdf: {
                type: 'boolean',
                description: 'Include a PDF in the response',
              },
              delay: {
                type: 'number',
                description: 'Delay before scraping (in milliseconds)',
              },
              useProxy: {
                type: 'boolean',
                description: 'Use a Steel-provided residential proxy for the scrape',
              },
              region: {
                type: 'string',
                enum: ['lax', 'ord', 'iad', 'bom', 'scl', 'fra', 'hkg'],
                description: 'The desired region for the action to be performed in',
              },
            },
            required: ['url'],
            additionalProperties: false,
          },
          ScrapeResponse: {
            title: 'scrapeResponse',
            type: 'object',
            properties: {
              content: {
                type: 'object',
                properties: {
                  html: {
                    type: 'string',
                    description: 'Raw HTML content of the webpage',
                  },
                  cleaned_html: {
                    type: 'string',
                    description: 'Cleaned HTML content of the webpage',
                  },
                  markdown: {
                    type: 'string',
                    description: 'Webpage content converted to Markdown',
                  },
                  readability: {
                    type: 'object',
                    additionalProperties: {},
                    description: 'Webpage content in Readability format',
                  },
                },
                additionalProperties: false,
              },
              metadata: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'Title of the webpage',
                  },
                  language: {
                    type: 'string',
                    description: 'Detected language of the webpage',
                  },
                  urlSource: {
                    type: 'string',
                    description: 'Source URL of the scraped page',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Timestamp when the scrape was performed',
                  },
                  description: {
                    type: 'string',
                    description: 'Description of the webpage',
                  },
                  keywords: {
                    type: 'string',
                    description: 'Keywords associated with the webpage',
                  },
                  author: {
                    type: 'string',
                    description: 'Author of the webpage content',
                  },
                  ogTitle: {
                    type: 'string',
                    description: 'Open Graph title',
                  },
                  ogDescription: {
                    type: 'string',
                    description: 'Open Graph description',
                  },
                  ogImage: {
                    type: 'string',
                    description: 'Open Graph image URL',
                  },
                  ogUrl: {
                    type: 'string',
                    description: 'Open Graph URL',
                  },
                  ogSiteName: {
                    type: 'string',
                    description: 'Open Graph site name',
                  },
                  articleAuthor: {
                    type: 'string',
                    description: 'Author of the article content',
                  },
                  publishedTime: {
                    type: 'string',
                    description: 'Publication time of the content',
                  },
                  modifiedTime: {
                    type: 'string',
                    description: 'Last modification time of the content',
                  },
                  canonical: {
                    type: 'string',
                    description: 'Canonical URL of the webpage',
                  },
                  favicon: {
                    type: 'string',
                    description: 'Favicon URL of the website',
                  },
                  jsonLd: {
                    description: 'JSON-LD structured data from the webpage',
                  },
                  statusCode: {
                    type: 'integer',
                    description: 'HTTP status code of the response',
                  },
                },
                required: ['statusCode'],
                additionalProperties: false,
              },
              links: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                      description: 'URL of the link',
                    },
                    text: {
                      type: 'string',
                      description: 'Text content of the link',
                    },
                  },
                  required: ['url', 'text'],
                  additionalProperties: false,
                },
              },
              screenshot: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'URL of the screenshot image',
                  },
                },
                required: ['url'],
                additionalProperties: false,
              },
              pdf: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description: 'URL of the generated PDF',
                  },
                },
                required: ['url'],
                additionalProperties: false,
              },
            },
            required: ['content', 'metadata', 'links'],
            additionalProperties: false,
            description: 'Response from a successful scrape request',
          },
          ScreenshotRequest: {
            title: 'screenshotRequest',
            type: 'object',
            properties: {
              url: {
                type: 'string',
                format: 'uri',
                description: 'URL of the webpage to capture',
              },
              useProxy: {
                type: 'boolean',
                description: 'Use a Steel-provided residential proxy for capturing the screenshot',
              },
              delay: {
                type: 'number',
                description: 'Delay before capturing the screenshot (in milliseconds)',
              },
              fullPage: {
                type: 'boolean',
                description: 'Capture the full page screenshot. Default is `false`.',
              },
              region: {
                type: 'string',
                enum: ['lax', 'ord', 'iad', 'bom', 'scl', 'fra', 'hkg'],
                description: 'The desired region for the action to be performed in',
              },
            },
            required: ['url'],
            additionalProperties: false,
          },
          ScreenshotResponse: {
            title: 'screenshotResponse',
            type: 'object',
            properties: {
              url: {
                type: 'string',
                format: 'uri',
                description: 'URL where the screenshot is hosted',
              },
            },
            required: ['url'],
            additionalProperties: false,
          },
          PdfRequest: {
            title: 'pdfRequest',
            type: 'object',
            properties: {
              url: {
                type: 'string',
                format: 'uri',
                description: 'URL of the webpage to convert to PDF',
              },
              useProxy: {
                type: 'boolean',
                description: 'Use a Steel-provided residential proxy for generating the PDF',
              },
              delay: {
                type: 'number',
                description: 'Delay before generating the PDF (in milliseconds)',
              },
              region: {
                type: 'string',
                enum: ['lax', 'ord', 'iad', 'bom', 'scl', 'fra', 'hkg'],
                description: 'The desired region for the action to be performed in',
              },
            },
            required: ['url'],
            additionalProperties: false,
          },
          PdfResponse: {
            title: 'pdfResponse',
            type: 'object',
            properties: {
              url: {
                type: 'string',
                format: 'uri',
                description: 'URL where the PDF is hosted',
              },
            },
            required: ['url'],
            additionalProperties: false,
          },
          GetContextsResponse: {
            title: 'getContextsResponse',
            type: 'object',
            properties: {
              contexts: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            required: ['contexts'],
            additionalProperties: false,
          },
          CreateContextRequest: {
            title: 'createContextRequest',
            type: 'object',
            properties: {
              proxy: {
                type: 'string',
              },
            },
            additionalProperties: false,
          },
          CreateContextResponse: {
            title: 'createContextResponse',
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
            required: ['id'],
            additionalProperties: false,
          },
          GetContextResponse: {
            title: 'getContextResponse',
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              details: {
                type: 'object',
                properties: {
                  proxy: {
                    type: 'string',
                  },
                },
                additionalProperties: false,
              },
            },
            required: ['id', 'details'],
            additionalProperties: false,
          },
          DeleteContextResponse: {
            title: 'deleteContextResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
            },
            required: ['message'],
            additionalProperties: false,
          },
          SessionIdParam: {
            title: 'sessionIdParam',
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                format: 'uuid',
              },
            },
            required: ['sessionId'],
            additionalProperties: false,
          },
          CreateLogRequest: {
            title: 'createLogRequest',
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'Request',
                  'Navigation',
                  'Console',
                  'PageError',
                  'RequestFailed',
                  'Response',
                  'Error',
                  'BrowserError',
                  'Recording',
                  'ScreencastFrame',
                ],
              },
              text: {
                type: 'string',
              },
              timestamp: {
                type: 'string',
              },
              pageId: {
                type: 'string',
              },
            },
            required: ['type', 'text', 'timestamp'],
            additionalProperties: false,
          },
          CreateLogResponse: {
            title: 'createLogResponse',
            type: 'object',
            properties: {
              log: {},
            },
            additionalProperties: false,
          },
          ApiLogIdParam: {
            title: 'apiLogIdParam',
            type: 'object',
            properties: {
              apiLogId: {
                type: 'string',
                format: 'uuid',
              },
            },
            required: ['apiLogId'],
            additionalProperties: false,
          },
          UpdateLogRequest: {
            title: 'updateLogRequest',
            type: 'object',
            properties: {
              creditsUsed: {
                type: 'number',
              },
              statusCode: {
                type: 'number',
              },
              path: {
                type: 'string',
              },
              method: {
                type: 'string',
              },
              body: {
                type: 'object',
                additionalProperties: {},
              },
              response: {
                type: 'object',
                additionalProperties: {},
              },
              responseTime: {
                type: 'number',
              },
              times: {
                type: 'object',
                additionalProperties: {
                  type: 'number',
                },
              },
            },
            additionalProperties: false,
          },
          UpdateLogResponse: {
            title: 'updateLogResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
            },
            required: ['message'],
            additionalProperties: false,
          },
          OrgIdQueryParam: {
            title: 'orgIdQueryParam',
            type: 'object',
            properties: {
              orgId: {
                type: 'string',
                format: 'uuid',
              },
            },
            required: ['orgId'],
            additionalProperties: false,
          },
          ClerkWebhookResponse: {
            title: 'clerkWebhookResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
            },
            required: ['message'],
            additionalProperties: false,
          },
          StripeWebhookResponse: {
            title: 'stripeWebhookResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
            },
            required: ['message'],
            additionalProperties: false,
          },
          CreateCheckoutSessionRequest: {
            title: 'createCheckoutSessionRequest',
            type: 'object',
            properties: {
              plan: {
                type: 'string',
                enum: ['hobby', 'starter', 'developer', 'pro'],
              },
            },
            required: ['plan'],
            additionalProperties: false,
          },
          CheckoutSessionResponse: {
            title: 'checkoutSessionResponse',
            type: 'object',
            properties: {
              url: {
                type: 'string',
              },
            },
            required: ['url'],
            additionalProperties: false,
          },
          UsageDetailsResponse: {
            title: 'usageDetailsResponse',
            type: 'object',
            properties: {
              plan: {
                type: 'string',
              },
              lastBillingDate: {
                type: 'string',
              },
              nextBillingDate: {
                type: 'string',
              },
              proxyUsageDetails: {
                type: 'object',
                properties: {
                  object: {
                    type: 'string',
                    enum: ['list'],
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                        },
                        object: {
                          type: 'string',
                          enum: ['billing.meter_event_summary'],
                        },
                        aggregated_value: {
                          type: 'number',
                        },
                        end_time: {
                          type: 'number',
                        },
                        livemode: {
                          type: 'boolean',
                        },
                        meter: {
                          type: 'string',
                        },
                        start_time: {
                          type: 'number',
                        },
                      },
                      required: [
                        'id',
                        'object',
                        'aggregated_value',
                        'end_time',
                        'livemode',
                        'meter',
                        'start_time',
                      ],
                      additionalProperties: false,
                    },
                  },
                  has_more: {
                    type: 'boolean',
                  },
                  url: {
                    type: 'string',
                  },
                },
                required: ['object', 'data', 'has_more', 'url'],
                additionalProperties: false,
              },
              browserUsageDetails: {
                type: 'object',
                properties: {
                  object: {
                    type: 'string',
                    enum: ['list'],
                  },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                        },
                        object: {
                          type: 'string',
                          enum: ['billing.meter_event_summary'],
                        },
                        aggregated_value: {
                          type: 'number',
                        },
                        end_time: {
                          type: 'number',
                        },
                        livemode: {
                          type: 'boolean',
                        },
                        meter: {
                          type: 'string',
                        },
                        start_time: {
                          type: 'number',
                        },
                      },
                      required: [
                        'id',
                        'object',
                        'aggregated_value',
                        'end_time',
                        'livemode',
                        'meter',
                        'start_time',
                      ],
                      additionalProperties: false,
                    },
                  },
                  has_more: {
                    type: 'boolean',
                  },
                  url: {
                    type: 'string',
                  },
                },
                required: ['object', 'data', 'has_more', 'url'],
                additionalProperties: false,
              },
              creditBalanceSummary: {
                type: 'object',
                properties: {
                  object: {
                    type: 'string',
                    enum: ['billing.credit_balance_summary'],
                  },
                  balances: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        available_balance: {
                          type: 'object',
                          properties: {
                            monetary: {
                              type: 'object',
                              properties: {
                                currency: {
                                  type: 'string',
                                  enum: ['usd'],
                                },
                                value: {
                                  type: 'number',
                                },
                              },
                              required: ['currency', 'value'],
                              additionalProperties: false,
                            },
                            type: {
                              type: 'string',
                              enum: ['monetary'],
                            },
                          },
                          required: ['monetary', 'type'],
                          additionalProperties: false,
                        },
                        ledger_balance: {
                          type: 'object',
                          properties: {
                            monetary: {
                              type: 'object',
                              properties: {
                                currency: {
                                  type: 'string',
                                  enum: ['usd'],
                                },
                                value: {
                                  type: 'number',
                                },
                              },
                              required: ['currency', 'value'],
                              additionalProperties: false,
                            },
                            type: {
                              type: 'string',
                              enum: ['monetary'],
                            },
                          },
                          required: ['monetary', 'type'],
                          additionalProperties: false,
                        },
                      },
                      required: ['available_balance', 'ledger_balance'],
                      additionalProperties: false,
                    },
                  },
                  customer: {
                    type: 'string',
                  },
                  livemode: {
                    type: 'boolean',
                  },
                },
                required: ['object', 'balances', 'customer', 'livemode'],
                additionalProperties: false,
              },
              billingPortalUrl: {
                type: 'string',
              },
            },
            required: [
              'plan',
              'lastBillingDate',
              'nextBillingDate',
              'proxyUsageDetails',
              'browserUsageDetails',
              'creditBalanceSummary',
              'billingPortalUrl',
            ],
            additionalProperties: false,
          },
          DetailsResponse: {
            title: 'detailsResponse',
            type: 'object',
            properties: {
              plan: {
                type: 'string',
              },
            },
            required: ['plan'],
            additionalProperties: false,
          },
          FileUploadRequest: {
            title: 'fileUploadRequest',
            type: 'object',
            properties: {
              file: {
                description: 'The file to upload (binary) or URL string to download from',
              },
              path: {
                type: 'string',
                description: 'Path to the file in the storage system',
              },
            },
            additionalProperties: false,
          },
          FileDetails: {
            title: 'fileDetails',
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file in the storage system',
              },
              size: {
                type: 'number',
                description: 'Size of the file in bytes',
              },
              lastModified: {
                type: 'string',
                format: 'date-time',
                description: 'Timestamp when the file was created',
              },
            },
            required: ['path', 'size', 'lastModified'],
            additionalProperties: false,
          },
          MultipleFiles: {
            title: 'multipleFiles',
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                      description: 'Path to the file in the storage system',
                    },
                    size: {
                      type: 'number',
                      description: 'Size of the file in bytes',
                    },
                    lastModified: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Timestamp when the file was created',
                    },
                  },
                  required: ['path', 'size', 'lastModified'],
                  additionalProperties: false,
                },
                description: 'Array of files for the current page',
              },
            },
            required: ['data'],
            additionalProperties: false,
          },
          PathParam: {
            title: 'pathParam',
            type: 'object',
            properties: {
              path: {
                type: 'string',
              },
            },
            required: ['path'],
            additionalProperties: false,
          },
          CreateJobRequest: {
            title: 'createJobRequest',
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The code to execute',
              },
            },
            required: ['code'],
            additionalProperties: false,
          },
          CreatePublicJobRequest: {
            title: 'createPublicJobRequest',
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'The id of the template to use',
              },
            },
            required: ['id'],
            additionalProperties: false,
          },
          JobIdParam: {
            title: 'jobIdParam',
            type: 'object',
            properties: {
              jobId: {
                type: 'string',
                description: 'The unique identifier for the sandbox job',
              },
            },
            required: ['jobId'],
            additionalProperties: false,
          },
          CreateJobResponse: {
            title: 'createJobResponse',
            type: 'object',
            properties: {
              jobId: {
                type: 'string',
                description: 'The unique identifier for the created job',
              },
            },
            required: ['jobId'],
            additionalProperties: false,
          },
          JobResponse: {
            title: 'jobResponse',
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['running', 'stopped', 'completed', 'failed'],
                description: 'Current status of the job',
              },
              id: {
                type: 'string',
                description: 'Unique identifier for the job',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'ISO date string when the job was created',
              },
              orgId: {
                type: 'string',
                description: 'Organization identifier that owns the job',
              },
              code: {
                type: 'string',
                description: 'The code that is being executed',
              },
              language: {
                type: 'string',
                description: 'Programming language of the job',
              },
            },
            required: ['status', 'id', 'createdAt', 'orgId', 'code', 'language'],
            additionalProperties: false,
          },
          JobSessionsResponse: {
            title: 'jobSessionsResponse',
            type: 'object',
            properties: {
              sessions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Session identifier',
                    },
                    status: {
                      type: 'string',
                      description: 'Current status of the session',
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'ISO date string when the session was created',
                    },
                  },
                  required: ['id', 'status', 'createdAt'],
                  additionalProperties: false,
                },
                description: 'Array of sessions associated with the job',
              },
            },
            required: ['sessions'],
            additionalProperties: false,
          },
          KillJobResponse: {
            title: 'killJobResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Success message confirming the job kill signal was sent',
              },
            },
            required: ['message'],
            additionalProperties: false,
          },
          CredentialMetadata: {
            title: 'credentialMetadata',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description:
                  'The namespace the credential is stored against. Defaults to "default".',
              },
              origin: {
                type: 'string',
                default: 'default',
                description: 'Website origin the credential is for',
              },
              label: {
                type: 'string',
                description: 'Label for the credential',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the credential was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the credential was last updated',
              },
            },
            required: ['createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          CredentialList: {
            title: 'credentialList',
            type: 'object',
            properties: {
              credentials: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    namespace: {
                      type: 'string',
                      default: 'default',
                      description:
                        'The namespace the credential is stored against. Defaults to "default".',
                    },
                    origin: {
                      type: 'string',
                      default: 'default',
                      description: 'Website origin the credential is for',
                    },
                    label: {
                      type: 'string',
                      description: 'Label for the credential',
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Date and time the credential was created',
                    },
                    updatedAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Date and time the credential was last updated',
                    },
                  },
                  required: ['createdAt', 'updatedAt'],
                  additionalProperties: false,
                },
              },
            },
            required: ['credentials'],
            additionalProperties: false,
          },
          CredentialCreate: {
            title: 'credentialCreate',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description:
                  'The namespace the credential is stored against. Defaults to "default".',
              },
              origin: {
                type: 'string',
                default: 'default',
                description: 'Website origin the credential is for',
              },
              label: {
                type: 'string',
                description: 'Label for the credential',
              },
              value: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                description: 'Value for the credential',
              },
            },
            required: ['value'],
            additionalProperties: false,
          },
          CredentialUpdate: {
            title: 'credentialUpdate',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                description:
                  'The namespace the credential is stored against. Defaults to "default".',
              },
              origin: {
                type: 'string',
                description: 'Website origin the credential is for',
              },
              label: {
                type: 'string',
                description: 'Label for the credential',
              },
              value: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                description: 'Value for the credential',
              },
            },
            additionalProperties: false,
          },
          CredentialsQuery: {
            title: 'credentialsQuery',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                description: 'namespace credential is stored against',
              },
              origin: {
                type: 'string',
                description: 'website origin the credential is for',
              },
            },
            additionalProperties: false,
          },
          CredentialNamespaceOrigin: {
            title: 'credentialNamespaceOrigin',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description:
                  'The namespace the credential is stored against. Defaults to "default".',
              },
              origin: {
                type: 'string',
                description: 'Website origin the credential is for',
              },
            },
            required: ['origin'],
            additionalProperties: false,
          },
          Credential: {
            title: 'credential',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description:
                  'The namespace the credential is stored against. Defaults to "default".',
              },
              origin: {
                type: 'string',
                default: 'default',
                description: 'Website origin the credential is for',
              },
              label: {
                type: 'string',
                description: 'Label for the credential',
              },
              value: {
                type: 'object',
                additionalProperties: {
                  type: 'string',
                },
                description: 'Value for the credential',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the credential was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the credential was last updated',
              },
            },
            required: ['value', 'createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          SecretMetadata: {
            title: 'secretMetadata',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description: 'The namespace the secret is stored against. Defaults to "default".',
              },
              key: {
                type: 'string',
                description: 'The key for the secret',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the secret was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the secret was last updated',
              },
            },
            required: ['key', 'createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          Secret: {
            title: 'secret',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description: 'The namespace the secret is stored against. Defaults to "default".',
              },
              key: {
                type: 'string',
                description: 'The key for the secret',
              },
              value: {
                type: 'string',
                description: 'The secret value',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the secret was created',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date and time the secret was last updated',
              },
            },
            required: ['key', 'value', 'createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          SecretList: {
            title: 'secretList',
            type: 'object',
            properties: {
              secrets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    namespace: {
                      type: 'string',
                      default: 'default',
                      description:
                        'The namespace the secret is stored against. Defaults to "default".',
                    },
                    key: {
                      type: 'string',
                      description: 'The key for the secret',
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Date and time the secret was created',
                    },
                    updatedAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Date and time the secret was last updated',
                    },
                  },
                  required: ['key', 'createdAt', 'updatedAt'],
                  additionalProperties: false,
                },
              },
            },
            required: ['secrets'],
            additionalProperties: false,
          },
          SecretCreate: {
            title: 'secretCreate',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description: 'The namespace the secret is stored against. Defaults to "default".',
              },
              key: {
                type: 'string',
                description: 'The key for the secret',
              },
              value: {
                type: 'string',
                description: 'The secret value',
              },
            },
            required: ['key', 'value'],
            additionalProperties: false,
          },
          SecretUpdate: {
            title: 'secretUpdate',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                description: 'The namespace the secret is stored against. Defaults to "default".',
              },
              key: {
                type: 'string',
                description: 'The key for the secret',
              },
              value: {
                type: 'string',
                description: 'The secret value',
              },
            },
            required: ['key', 'value'],
            additionalProperties: false,
          },
          SecretsQuery: {
            title: 'secretsQuery',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                description: 'namespace secret is stored against',
              },
              key: {
                type: 'string',
                description: 'specific key to filter by',
              },
            },
            additionalProperties: false,
          },
          SecretKey: {
            title: 'secretKey',
            type: 'object',
            properties: {
              namespace: {
                type: 'string',
                default: 'default',
                description: 'The namespace the secret is stored against. Defaults to "default".',
              },
              key: {
                type: 'string',
                description: 'The key for the secret',
              },
            },
            required: ['key'],
            additionalProperties: false,
          },
          FeedbackRequest: {
            title: 'feedbackRequest',
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                minLength: 1,
              },
              feedback: {
                type: 'string',
                minLength: 1,
              },
              reaction: {
                type: 'string',
              },
            },
            required: ['topic', 'feedback'],
            additionalProperties: false,
          },
          FeedbackResponse: {
            title: 'feedbackResponse',
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
              message: {
                type: 'string',
              },
            },
            required: ['success'],
            additionalProperties: false,
          },
          QuestionnaireRequest: {
            title: 'questionnaireRequest',
            type: 'object',
            properties: {
              responses: {
                type: 'object',
                properties: {
                  what_describes_you: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  what_planning_to_build: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  how_hear_about_steel: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
                additionalProperties: true,
              },
              metadata: {
                type: 'object',
                additionalProperties: {},
              },
            },
            required: ['responses'],
            additionalProperties: false,
          },
          QuestionnaireResponse: {
            title: 'questionnaireResponse',
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
              },
              message: {
                type: 'string',
              },
              data: {},
            },
            required: ['success'],
            additionalProperties: false,
          },
          QuestionnaireStatusResponse: {
            title: 'questionnaireStatusResponse',
            type: 'object',
            properties: {
              hasCompleted: {
                type: 'boolean',
              },
              completedAt: {
                type: 'string',
              },
            },
            required: ['hasCompleted'],
            additionalProperties: false,
          },
          QuestionnaireGetResponse: {
            title: 'questionnaireGetResponse',
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              responses: {
                type: 'object',
                properties: {
                  what_describes_you: {
                    type: 'string',
                  },
                  what_planning_to_build: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  how_hear_about_steel: {
                    type: 'string',
                  },
                },
                additionalProperties: true,
              },
              metadata: {
                type: 'object',
                additionalProperties: {},
              },
              completedAt: {
                type: 'string',
              },
              createdAt: {
                type: 'string',
              },
              updatedAt: {
                type: 'string',
              },
            },
            required: ['createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          CaptchaState: {
            title: 'captchaState',
            type: 'object',
            properties: {
              pageId: {
                type: 'string',
                description: 'The page ID where the captcha is located',
              },
              url: {
                type: 'string',
                description: 'The URL where the captcha is located',
              },
              isSolvingCaptcha: {
                type: 'boolean',
                description: 'Whether a captcha is currently being solved',
              },
              tasks: {
                type: 'array',
                description: 'Array of captcha tasks',
              },
              created: {
                type: 'number',
                description: 'Timestamp when the state was created',
              },
              lastUpdated: {
                type: 'number',
                description: 'Timestamp when the state was last updated',
              },
            },
            required: ['pageId', 'url', 'isSolvingCaptcha', 'tasks'],
            additionalProperties: false,
          },
          CaptchaStateResponse: {
            title: 'captchaStateResponse',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pageId: {
                  type: 'string',
                  description: 'The page ID where the captcha is located',
                },
                url: {
                  type: 'string',
                  description: 'The URL where the captcha is located',
                },
                isSolvingCaptcha: {
                  type: 'boolean',
                  description: 'Whether a captcha is currently being solved',
                },
                tasks: {
                  type: 'array',
                  description: 'Array of captcha tasks',
                },
                created: {
                  type: 'number',
                  description: 'Timestamp when the state was created',
                },
                lastUpdated: {
                  type: 'number',
                  description: 'Timestamp when the state was last updated',
                },
              },
              required: ['pageId', 'url', 'isSolvingCaptcha', 'tasks'],
              additionalProperties: false,
            },
          },
          SolveImageCaptchaRequest: {
            title: 'solveImageCaptchaRequest',
            type: 'object',
            properties: {
              imageXPath: {
                type: 'string',
                description: 'XPath to the captcha image element',
              },
              inputXPath: {
                type: 'string',
                description: 'XPath to the captcha input element',
              },
              url: {
                type: 'string',
                description: 'URL where the captcha is located. Defaults to the current page URL',
              },
            },
            required: ['imageXPath', 'inputXPath'],
            additionalProperties: false,
          },
          CaptchaActionResponse: {
            title: 'captchaActionResponse',
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                description: 'Whether the action was successful',
              },
              message: {
                type: 'string',
                description: 'Response message',
              },
            },
            required: ['success'],
            additionalProperties: false,
          },
          UploadExtensionRequest: {
            title: 'uploadExtensionRequest',
            type: 'object',
            properties: {
              file: {
                description: 'Extension .zip/.crx file',
              },
              url: {
                type: 'string',
                format: 'uri',
                description: 'Extension URL',
              },
            },
            additionalProperties: false,
          },
          ExtensionIdParam: {
            title: 'extensionIdParam',
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Extension ID',
              },
            },
            required: ['id'],
            additionalProperties: false,
          },
          Extension: {
            title: 'extension',
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique extension identifier (e.g., ext_12345)',
              },
              name: {
                type: 'string',
                description: 'Extension name',
              },
              createdAt: {
                type: 'string',
                description: 'Creation timestamp',
              },
              updatedAt: {
                type: 'string',
                description: 'Last update timestamp',
              },
            },
            required: ['id', 'name', 'createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          ExtensionList: {
            title: 'extensionList',
            type: 'object',
            properties: {
              extensions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Unique extension identifier (e.g., ext_12345)',
                    },
                    name: {
                      type: 'string',
                      description: 'Extension name',
                    },
                    createdAt: {
                      type: 'string',
                      description: 'Creation timestamp',
                    },
                    updatedAt: {
                      type: 'string',
                      description: 'Last update timestamp',
                    },
                  },
                  required: ['id', 'name', 'createdAt', 'updatedAt'],
                  additionalProperties: false,
                },
                description: 'List of extensions for the organization',
              },
              count: {
                type: 'number',
                description: 'Total number of extensions',
              },
            },
            required: ['extensions', 'count'],
            additionalProperties: false,
            description: 'Response containing a list of extensions for the organization',
          },
          ExtensionUploadResponse: {
            title: 'extensionUploadResponse',
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'Unique extension identifier (e.g., ext_12345)',
              },
              name: {
                type: 'string',
                description: 'Extension name',
              },
              createdAt: {
                type: 'string',
                description: 'Creation timestamp',
              },
              updatedAt: {
                type: 'string',
                description: 'Last update timestamp',
              },
            },
            required: ['id', 'name', 'createdAt', 'updatedAt'],
            additionalProperties: false,
          },
          DeleteResponse: {
            title: 'deleteResponse',
            type: 'object',
            properties: {
              message: {
                type: 'string',
              },
            },
            required: ['message'],
            additionalProperties: false,
          },
        },
      },
      paths: {
        '/public/{path}': {
          get: {
            operationId: 'get_static_asset',
            summary: 'Get a static asset',
            tags: ['static'],
            description: 'Get a static asset',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'path',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
              },
            },
          },
        },
        '/sdk-openapi.json': {
          get: {
            responses: {
              '200': {
                description: 'Default Response',
              },
            },
          },
        },
        '/v1/api-keys': {
          get: {
            operationId: 'get_api_keys',
            summary: 'Retrieve all API keys from the database.',
            tags: ['api-keys'],
            description: 'Get all API keys',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ApiKeysResponse',
                    },
                  },
                },
              },
            },
          },
          post: {
            operationId: 'create_api_key',
            summary: 'Create a new API key using the below details.',
            tags: ['api-keys'],
            description: 'Create an API key',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateAPIKeyRequest',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ApiKeyResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/api-keys/onboarding': {
          get: {
            operationId: 'get_onboarding_api_key',
            summary: 'Retrieve the onboarding API key from the database.',
            tags: ['api-keys'],
            description: 'Get the onboarding API key',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ApiKeyResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/api-keys/{id}': {
          delete: {
            operationId: 'delete_api_key',
            summary: 'Delete an API key using its ID.',
            tags: ['api-keys'],
            description: 'Delete an API key',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/DeleteAPIKeyResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/scrape': {
          post: {
            operationId: 'scrape',
            summary: 'Scrape webpage content',
            tags: ['Browser Tools', 'public'],
            description: 'Extracts content from a specified URL.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ScrapeRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ScrapeResponse',
                    },
                  },
                },
              },
              '503': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/screenshot': {
          post: {
            operationId: 'screenshot',
            summary: 'Capture webpage screenshot',
            tags: ['Browser Tools', 'public'],
            description: 'Captures a screenshot of a specified webpage.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ScreenshotRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ScreenshotResponse',
                    },
                  },
                },
              },
              '503': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/pdf': {
          post: {
            operationId: 'pdf',
            summary: 'Convert webpage to PDF',
            tags: ['Browser Tools', 'public'],
            description: 'Generates a PDF from a specified webpage.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PdfRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/PdfResponse',
                    },
                  },
                },
              },
              '503': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions': {
          get: {
            operationId: 'get_sessions',
            summary: 'List all sessions',
            tags: ['Sessions', 'public'],
            description: 'Fetches all active sessions for the current organization.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'cursorId',
                required: false,
                description: 'Cursor ID for pagination',
              },
              {
                schema: {
                  type: 'integer',
                },
                in: 'query',
                name: 'limit',
                required: false,
                description: 'Number of sessions to return. Default is 50.',
              },
              {
                schema: {
                  type: 'string',
                  enum: ['live', 'released', 'failed'],
                },
                in: 'query',
                name: 'status',
                required: false,
                description: 'Filter sessions by current status',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionsResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          post: {
            operationId: 'create_session',
            summary: 'Create a session',
            tags: ['Sessions', 'public'],
            description: 'Creates a new session with the provided configuration.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateSessionRequest',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '429': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/release': {
          post: {
            operationId: 'release_all_sessions',
            summary: 'Release all sessions',
            tags: ['Sessions', 'public'],
            description: 'Releases all active sessions for the current organization.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NullableRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ReleaseSessionsResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}': {
          get: {
            operationId: 'get_session',
            summary: 'Get session details',
            tags: ['Sessions', 'public'],
            description: 'Retrieves details of a specific session by ID.',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_session',
            summary: 'Delete a session',
            tags: ['Sessions'],
            description: 'Deletes a specific session by ID.',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ReleaseSessionResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/context': {
          get: {
            operationId: 'get_session_context',
            summary: 'Get session context',
            tags: ['Sessions', 'public'],
            description: 'Fetches the context data of a specific session.',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionContextResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/logs': {
          get: {
            operationId: 'get_session_logs',
            summary: 'Get session logs',
            tags: ['Sessions'],
            description: 'Get session logs',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/GetSessionLogsResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/events': {
          get: {
            operationId: 'get_session_events',
            summary: 'Get recorded events',
            tags: ['Sessions', 'public'],
            description:
              'This endpoint allows you to get the recorded session events in the RRWeb format',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/GetSessionEventsResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/debugger': {
          get: {
            operationId: 'get_session_debugger',
            summary: 'Get session debugger URL.',
            tags: ['Sessions'],
            description: 'Fetches the Chrome DevTools debugger URL of the specific session.',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionDebuggerResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/release': {
          post: {
            operationId: 'release_session',
            summary: 'Release a session',
            tags: ['Sessions', 'public'],
            description: 'Releases a specific session by ID.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NullableRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ReleaseSessionResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/player': {
          get: {
            operationId: 'get_session_viewer',
            summary: 'Get session viewer',
            tags: ['Sessions'],
            description: 'Returns a live, interactive browser session stream',
            parameters: [
              {
                schema: {
                  type: 'boolean',
                  default: true,
                },
                in: 'query',
                name: 'showControls',
                required: false,
                description: 'Show controls in the browser iframe',
              },
              {
                schema: {
                  type: 'string',
                  enum: ['dark', 'light'],
                  default: 'dark',
                },
                in: 'query',
                name: 'theme',
                required: false,
                description: 'Theme of the browser iframe',
              },
              {
                schema: {
                  type: 'boolean',
                  default: true,
                },
                in: 'query',
                name: 'interactive',
                required: false,
                description: 'Make the browser iframe interactive',
              },
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'pageId',
                required: false,
                description: 'Page ID to connect to',
              },
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'pageIndex',
                required: false,
                description: 'Page index (or tab index) to connect to',
              },
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionPlayerResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/live-details': {
          get: {
            operationId: 'get_session_live_details',
            summary: 'Get live session details',
            tags: ['Sessions', 'public'],
            description:
              'Returns the live state of the session, including pages, tabs, and browser state',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionLiveDetailsResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/proxy': {
          get: {
            operationId: 'get_session_proxy',
            summary: 'Get session proxy status',
            tags: ['Sessions'],
            description: 'Gets the proxy status for a specific session',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionProxyResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{id}/proxy/swap': {
          post: {
            operationId: 'swap_session_proxy',
            summary: 'Swap session proxy',
            tags: ['Sessions'],
            description: 'Swaps/refreshes the proxy for a specific session',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NullableRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionProxySwapResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/public/{id}': {
          get: {
            operationId: 'get_session_public',
            summary: 'Get session details',
            tags: ['Sessions'],
            description: 'Retrieves details of a specific session by ID.',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SessionResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/public/{id}/events': {
          get: {
            operationId: 'get_session_events_public',
            summary: 'Get recorded events',
            tags: ['Sessions'],
            description:
              'This endpoint allows you to get the recorded session events in the RRWeb format',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/GetSessionEventsResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/public/{id}/logs': {
          get: {
            operationId: 'get_session_logs_public',
            summary: 'Get session logs',
            tags: ['Sessions'],
            description: 'Get session logs',
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'id',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/GetSessionLogsResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/log-sink/{sessionId}': {
          post: {
            operationId: 'create_log',
            summary: 'Create a log',
            tags: ['logs'],
            description: 'Create a log',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateLogRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'query',
                name: 'orgId',
                required: true,
              },
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CreateLogResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/api-logs/{apiLogId}': {
          put: {
            operationId: 'update_api_log',
            summary: 'Update an API log',
            tags: ['logs'],
            description: 'Update an API log',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UpdateLogRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                  format: 'uuid',
                },
                in: 'path',
                name: 'apiLogId',
                required: true,
              },
            ],
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UpdateLogResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/billing-session': {
          post: {
            operationId: 'manage_billing',
            summary: 'Manage billing for an organization',
            tags: ['billing'],
            description: 'Manage billing for an organization',
            responses: {
              '200': {
                description: 'Default Response',
              },
            },
          },
        },
        '/v1/checkout-session': {
          post: {
            operationId: 'create_checkout_session',
            summary: 'Create checkout session',
            tags: ['billing'],
            description: 'Create a checkout session for plan upgrade/downgrade',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateCheckoutSessionRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CheckoutSessionResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/usage-details': {
          post: {
            operationId: 'usage_details',
            summary: 'Get usage details for an organization',
            tags: ['billing'],
            description: 'Get usage details for an organization',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/UsageDetailsResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/details': {
          get: {
            operationId: 'organization_details',
            summary: 'Get details for an organization',
            tags: ['organization'],
            description: 'Get details for an organization',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/DetailsResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{sessionId}/files': {
          post: {
            operationId: 'upload_file',
            summary: 'Upload a file',
            tags: ['Files', 'public'],
            description:
              'Uploads a file to a session via `multipart/form-data` with a `file` field that accepts either binary data or a URL string to download from, and an optional `path` field for the file storage path.',
            requestBody: {
              content: {
                'multipart/form-data': {
                  schema: {
                    $ref: '#/components/schemas/FileUploadRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
              },
            ],
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/FileDetails',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '415': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          get: {
            operationId: 'list_files',
            summary: 'List files',
            tags: ['Files', 'public'],
            description: 'List all files from the session in descending order.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/MultipleFiles',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_all_files',
            summary: 'Delete all files',
            tags: ['Files', 'public'],
            description: 'Delete all files from a session',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
              },
            ],
            responses: {
              '204': {
                description: 'All files successfully deleted',
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{sessionId}/files/{path}': {
          get: {
            operationId: 'download_file',
            summary: 'Download a file',
            tags: ['Files', 'public'],
            description: 'Download a file from a session',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
              },
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'path',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Successful download',
                content: {
                  'application/octet-stream': {
                    schema: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_file',
            summary: 'Delete a file',
            tags: ['Files', 'public'],
            description: 'Delete a file from a session',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
              },
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'path',
                required: true,
              },
            ],
            responses: {
              '204': {
                description: 'File successfully deleted',
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{sessionId}/files.zip': {
          get: {
            operationId: 'download_archive',
            summary: 'Download archive',
            tags: ['Files', 'public'],
            description: 'Download all files from the session as a zip archive.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Successful download',
                content: {
                  'application/zip': {
                    schema: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/static/{path}': {
          get: {
            operationId: 'download_static_file',
            summary: 'Download a static file',
            tags: ['Files'],
            description: 'Download a static file',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'path',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Successful download',
                content: {
                  'application/octet-stream': {
                    schema: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/files': {
          post: {
            operationId: 'upload_global_file',
            summary: 'Upload a global file',
            tags: ['Files', 'public'],
            description:
              'Uploads a file to global storage via `multipart/form-data` with a `file` field that accepts either binary data or a URL string to download from, and an optional `path` field for the file storage path.',
            requestBody: {
              content: {
                'multipart/form-data': {
                  schema: {
                    $ref: '#/components/schemas/FileUploadRequest',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/FileDetails',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '415': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          get: {
            operationId: 'list_global_files',
            summary: 'List global files',
            tags: ['Files', 'public'],
            description: 'List all global files for the organization in descending order.',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/MultipleFiles',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/files/{path}': {
          get: {
            operationId: 'download_global_file',
            summary: 'Download a global file',
            tags: ['Files', 'public'],
            description: 'Download a file from global storage',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'path',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Successful download',
                content: {
                  'application/octet-stream': {
                    schema: {
                      type: 'string',
                      format: 'binary',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_global_file',
            summary: 'Delete a global file',
            tags: ['Files', 'public'],
            description: 'Delete a file from global storage',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'path',
                required: true,
              },
            ],
            responses: {
              '204': {
                description: 'File successfully deleted',
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/jobs': {
          post: {
            operationId: 'create_job',
            summary: 'Create a sandbox job',
            tags: ['Sandbox'],
            description: 'Creates a new sandbox job with the provided configuration.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateJobRequest',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CreateJobResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/jobs/{jobId}': {
          get: {
            operationId: 'get_job',
            summary: 'Get sandbox job details',
            tags: ['Sandbox'],
            description: 'Retrieves details of a specific sandbox job by ID.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'jobId',
                required: true,
                description: 'The unique identifier for the sandbox job',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/JobResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/jobs/{jobId}/sessions': {
          get: {
            operationId: 'get_job_sessions',
            summary: 'Get sandbox job sessions',
            tags: ['Sandbox'],
            description: 'Retrieves all sessions associated with a specific sandbox job.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'jobId',
                required: true,
                description: 'The unique identifier for the sandbox job',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/JobSessionsResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/jobs/{jobId}/kill': {
          post: {
            operationId: 'kill_job',
            summary: 'Kill a sandbox job',
            tags: ['Sandbox'],
            description: 'Terminates a specific sandbox job and releases its resources.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NullableRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'jobId',
                required: true,
                description: 'The unique identifier for the sandbox job',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/KillJobResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/public/jobs': {
          post: {
            operationId: 'create_public_job',
            summary: 'Create a public sandbox job',
            tags: ['Sandbox'],
            description: 'Creates a new public sandbox job without authentication.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreatePublicJobRequest',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CreateJobResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/public/jobs/{jobId}': {
          get: {
            operationId: 'get_public_job',
            summary: 'Get public sandbox job details',
            tags: ['Sandbox'],
            description: 'Retrieves details of a specific public sandbox job by ID.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'jobId',
                required: true,
                description: 'The unique identifier for the sandbox job',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/JobResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/public/jobs/{jobId}/sessions': {
          get: {
            operationId: 'get_public_job_sessions',
            summary: 'Get public sandbox job sessions',
            tags: ['Sandbox'],
            description: 'Retrieves all sessions associated with a specific public sandbox job.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'jobId',
                required: true,
                description: 'The unique identifier for the sandbox job',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/JobSessionsResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sandbox/public/jobs/{jobId}/kill': {
          post: {
            operationId: 'kill_public_job',
            summary: 'Kill a public sandbox job',
            tags: ['Sandbox'],
            description: 'Terminates a specific public sandbox job and releases its resources.',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NullableRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'jobId',
                required: true,
                description: 'The unique identifier for the sandbox job',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/KillJobResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/credentials': {
          get: {
            operationId: 'list_credentials',
            summary: 'List all credential metadata',
            tags: ['Credentials', 'public'],
            description: 'Fetches all credential metadata for the current organization.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'namespace',
                required: false,
                description: 'namespace credential is stored against',
              },
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'origin',
                required: false,
                description: 'website origin the credential is for',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CredentialList',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          post: {
            operationId: 'create_credential',
            summary: 'Stores credentials',
            tags: ['Credentials', 'public'],
            description: 'Encrypts and stores credentials for an origin',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CredentialCreate',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CredentialMetadata',
                    },
                  },
                },
              },
              '208': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          put: {
            operationId: 'update_credential',
            summary: 'Updates credentials',
            tags: ['Credentials', 'public'],
            description: 'Encrypts and updates credentials for an origin',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CredentialUpdate',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CredentialMetadata',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_credential',
            summary: 'Deletes credentials',
            tags: ['Credentials', 'public'],
            description: 'Deletes encrypted credentials from the database',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CredentialNamespaceOrigin',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SuccessResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/secrets': {
          get: {
            operationId: 'list_secrets',
            summary: 'List all secret metadata',
            tags: ['Secrets'],
            description: 'Fetches all secret metadata for the current organization.',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'namespace',
                required: false,
                description: 'namespace secret is stored against',
              },
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'key',
                required: false,
                description: 'specific key to filter by',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SecretList',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          post: {
            operationId: 'create_secret',
            summary: 'Store secret',
            tags: ['Secrets'],
            description: 'Encrypts and stores a secret',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SecretCreate',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SecretMetadata',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          put: {
            operationId: 'update_secret',
            summary: 'Update secret',
            tags: ['Secrets'],
            description: 'Encrypts and updates a secret',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SecretUpdate',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SecretMetadata',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_secret',
            summary: 'Delete secret',
            tags: ['Secrets'],
            description: 'Deletes a secret from the database',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SecretKey',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/SuccessResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/secrets/{key}': {
          get: {
            operationId: 'get_secret',
            summary: 'Get secret value',
            tags: ['Secrets'],
            description: 'Fetches a specific secret value',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'query',
                name: 'namespace',
                required: false,
              },
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'key',
                required: true,
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Secret',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/feedback': {
          post: {
            operationId: 'submit_feedback',
            summary: 'Submit user feedback that will be sent to Discord webhook.',
            tags: ['Feedback'],
            description: 'Submit feedback to Discord',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/FeedbackRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/FeedbackResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/FeedbackResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/questionnaire': {
          get: {
            operationId: 'get_questionnaire',
            summary: "Get the user's questionnaire responses and status.",
            tags: ['Questionnaire'],
            description: 'Get questionnaire data',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/QuestionnaireGetResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/QuestionnaireResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/QuestionnaireResponse',
                    },
                  },
                },
              },
            },
          },
          post: {
            operationId: 'submit_questionnaire',
            summary: 'Submit user questionnaire responses.',
            tags: ['Questionnaire'],
            description: 'Submit questionnaire responses',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/QuestionnaireRequest',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/QuestionnaireResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/QuestionnaireResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{sessionId}/captchas/status': {
          get: {
            operationId: 'get_captcha_status',
            summary: 'Get captcha status',
            tags: ['Captchas', 'public'],
            description: 'Gets the current captcha status for a session',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
                description: 'Session ID',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CaptchaStateResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/sessions/{sessionId}/captchas/solve-image': {
          post: {
            operationId: 'solve_image_captcha',
            summary: 'Solve image captcha',
            tags: ['Captchas', 'public'],
            description: 'Solves an image captcha using XPath selectors',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SolveImageCaptchaRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'sessionId',
                required: true,
                description: 'Session ID',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/CaptchaActionResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/extensions': {
          post: {
            operationId: 'upload_extension',
            summary: 'Upload extension',
            tags: ['Extensions', 'public'],
            description:
              'Upload a Chrome extension (.zip/.crx file or Chrome Web Store URL) for the organization',
            requestBody: {
              content: {
                'multipart/form-data': {
                  schema: {
                    $ref: '#/components/schemas/UploadExtensionRequest',
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ExtensionUploadResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          get: {
            operationId: 'list_extensions',
            summary: 'List extensions',
            tags: ['Extensions', 'public'],
            description: 'List all extensions for the organization',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ExtensionList',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_all_extensions',
            summary: 'Delete all extensions',
            tags: ['Extensions', 'public'],
            description: 'Delete all extensions for the organization',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/DeleteResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/v1/extensions/{extensionId}': {
          get: {
            operationId: 'download_extension',
            summary: 'Download extension',
            tags: ['Extensions', 'public'],
            description: 'Download an extension file by extension ID',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'extensionId',
                required: true,
                description: 'Extension ID',
              },
            ],
            responses: {
              '200': {
                description: 'Extension zip file',
                content: {
                  'application/json': {
                    schema: {
                      type: 'string',
                      format: 'binary',
                      description: 'Extension zip file',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          put: {
            operationId: 'update_extension',
            summary: 'Update extension',
            tags: ['Extensions', 'public'],
            description:
              'Update a Chrome extension (.zip/.crx file or Chrome Web Store URL) for the organization',
            requestBody: {
              content: {
                'multipart/form-data': {
                  schema: {
                    $ref: '#/components/schemas/UploadExtensionRequest',
                  },
                },
              },
            },
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'extensionId',
                required: true,
                description: 'Extension ID',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ExtensionUploadResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '409': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
          delete: {
            operationId: 'delete_extension',
            summary: 'Delete extension',
            tags: ['Extensions', 'public'],
            description: 'Delete an extension by ID',
            parameters: [
              {
                schema: {
                  type: 'string',
                },
                in: 'path',
                name: 'extensionId',
                required: true,
                description: 'Extension ID',
              },
            ],
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/DeleteResponse',
                    },
                  },
                },
              },
              '400': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '404': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
              '500': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ErrorResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/webhooks/clerk': {
          post: {
            operationId: 'clerk_webhook',
            summary: 'Handle a clerk webhook',
            tags: ['webhooks'],
            description: 'Handle a clerk webhook',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/ClerkWebhookResponse',
                    },
                  },
                },
              },
            },
          },
        },
        '/webhooks/stripe': {
          post: {
            operationId: 'stripe_webhook',
            summary: 'Handle a Stripe webhook',
            tags: ['webhooks'],
            description: 'Handle a Stripe webhook',
            responses: {
              '200': {
                description: 'Default Response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/StripeWebhookResponse',
                    },
                  },
                },
              },
            },
          },
        },
      },
      servers: [
        {
          url: 'https://api.steel.dev',
          description: 'Steel production server',
        },
      ],
      security: [
        {
          apiKey: [],
        },
        {},
      ],
    };

    await fs.writeFile(platformApiPath, JSON.stringify(platformApiSpec, null, 2));
  } catch (error) {
    console.error('❌ Failed to generate platform-api.json:', error);
  }
}

async function fetchApiSpec(spec: ApiSpec): Promise<void> {
  try {
    const response = await fetch(spec.url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();

    // Validate that the response is valid JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Invalid JSON response from ${spec.url}: ${parseError}`);
    }

    // Ensure openapi directory exists
    const openApiDir = path.join(process.cwd(), 'openapi');
    await fs.mkdir(openApiDir, { recursive: true });

    // Write the file with proper naming convention
    const filename = `${spec.name}-api.json`;
    const filepath = path.join(openApiDir, filename);

    await fs.writeFile(filepath, JSON.stringify(jsonData, null, 2));
  } catch (error) {
    console.error(`❌ Failed to fetch ${spec.name}:`, error);
  }
}

async function fetchGitHubApiSpec(spec: GitHubApiSpec): Promise<void> {
  try {
    // Construct the raw GitHub URL
    const rawUrl = `https://raw.githubusercontent.com/${spec.repo}/${spec.branch}/${spec.filePath}`;

    const response = await fetch(rawUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const yamlText = await response.text();

    // Parse YAML to check if it's valid
    let yamlData: unknown;
    try {
      yamlData = yaml.load(yamlText);
    } catch (parseError) {
      throw new Error(`Invalid YAML from ${rawUrl}: ${parseError}`);
    }

    // Use swagger-parser to dereference and bundle the spec
    // Pass the raw URL as the base URL so $ref resolution works correctly
    const bundledSpec = await SwaggerParser.dereference(rawUrl, yamlData as any);

    // Ensure openapi directory exists
    const openApiDir = path.join(process.cwd(), 'openapi');
    await fs.mkdir(openApiDir, { recursive: true });

    // Write the file with proper naming convention
    const filename = `${spec.name}-api.json`;
    const filepath = path.join(openApiDir, filename);

    await fs.writeFile(filepath, stringify(bundledSpec, null, 2));
  } catch (error) {
    console.error(`❌ Failed to fetch ${spec.name}:`, error);
  }
}

async function generateMarkdownForSpec(specPath: string, specName: string): Promise<void> {
  try {
    console.log(`📝 Generating markdown for ${specName}...`);

    // Read the OpenAPI spec
    const specContent = await fs.readFile(specPath, 'utf-8');
    const spec = JSON.parse(specContent) as OpenAPIV3.Document | OpenAPIV3_1.Document;

    // Create markdown generator
    const generator = new OpenAPIMarkdownGenerator(spec);

    // Generate markdown for all endpoints
    const markdownMap = await generator.generateAllEndpoints();

    // Create output directory
    const outputDir = path.join(process.cwd(), 'generated', 'apis', specName);
    await fs.mkdir(outputDir, { recursive: true });

    // Create mapping for URL to file lookup
    const urlMapping: Record<string, { method: string; path: string; file: string }> = {};

    // Save each endpoint's markdown
    let count = 0;
    for (const [key, markdown] of markdownMap) {
      // Create a filename from the endpoint key
      // e.g., "GET /v1/users/{id}" -> "get-v1-users-id.md"
      const filename = `${key
        .toLowerCase()
        .replace(/[{}]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}.md`;

      const filePath = path.join(outputDir, filename);
      await fs.writeFile(filePath, markdown.content);

      // Add to mapping
      urlMapping[key] = {
        method: markdown.method,
        path: markdown.endpoint,
        file: filename,
      };

      count++;
    }

    // Save the mapping file
    const mappingPath = path.join(outputDir, '_mapping.json');
    await fs.writeFile(mappingPath, JSON.stringify(urlMapping, null, 2));

    console.log(`✔️ Generated ${count} markdown files for ${specName}`);
  } catch (error) {
    console.error(`❌ Failed to generate markdown for ${specName}:`, error);
  }
}

async function generateAllMarkdown(): Promise<void> {
  console.log('\n📚 Generating markdown documentation...\n');

  const openApiDir = path.join(process.cwd(), 'openapi');

  // Get all OpenAPI spec files
  const specFiles = await fs.readdir(openApiDir);
  const jsonFiles = specFiles.filter((file) => file.endsWith('.json'));

  // Generate markdown for each spec
  const markdownPromises = jsonFiles.map((file) => {
    const specPath = path.join(openApiDir, file);
    const specName = file.replace('-api.json', '');
    return generateMarkdownForSpec(specPath, specName);
  });

  await Promise.all(markdownPromises);

  // Build and save endpoint mappings
  console.log('\n📍 Building endpoint mappings...');
  const mappings = await buildEndpointMappings();
  await saveMappings(mappings);

  console.log('\n✔️ Markdown generation complete!');
}

async function fetchAllSpecs(): Promise<void> {
  console.log('Fetching OpenAPI specs...');

  // Generate platform API spec and fetch other specs concurrently
  const allPromises = [
    // generatePlatformApiSpec(),
    // ...API_SPECS.map((spec) => fetchApiSpec(spec)),
    // ...GITHUB_API_SPECS.map((spec) => fetchGitHubApiSpec(spec)),
  ];

  await Promise.all(allPromises);

  console.log('✔️ Generated OpenAPI specs');

  // Generate markdown for all specs
  await generateAllMarkdown();
}

// Run the script if this file is executed directly
if (require.main === module) {
  // fetchAllSpecs().catch(console.error);
}

export { fetchAllSpecs, fetchApiSpec, fetchGitHubApiSpec, generatePlatformApiSpec };
