
// I found this query in a StackOverflow post: https://stackoverflow.com/questions/34182163/how-to-get-residentadvisor-api-work
// This is what led me to believe it would be possible to reach out to Resident Advisor's GraphQL API
//--data '{"query":"query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) { eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: { attending: { priority: 1, order: DESCENDING } }) {   data {     id     listingDate     event {       ...eventFields       __typename     }     __typename   }   __typename }\r\n}\r\n\r\nfragment eventFields on Event { id title attending date contentUrl flyerFront queueItEnabled newEventForm images {   id   filename   alt   type   crop   __typename } venue {   id   name   contentUrl   live   __typename } __typename\r\n}","variables":{"filters":{"areas":{"eq":229},"listingDate":{"gte":"2023-06-01","lte":"2023-08-04"},"listingPosition":{"eq":1}},"pageSize":10}}'
  // 7: 
  // 8: New York
  // 17: Chicago
  // 19: Detroit
  // 20: Barcelona
  // 22: Washington DC
  // 23: Los Angeles
  // 24: Bristol, UK
  // 25: Ibiza
  // 26: Costa Rica
  // 27: Tokyo
  // 28: Toronto, Canada
  // 29: Amsterdam
  // 30: Scotland, UK
  // 31: 
  // 32: 
  // 33: 
  // 34: Berlin, Germany
  // 35: Belfast, UK
  // 36:Kuala Lumpur, Malaysia
  // 37: Athens, Greece
  // 38: Miami, Florida
  // 39: Vancouver, BC, Canada
  // 40: Montreal, Canada
  // 41: Madrid
  // 42: Tel Aviv, Israel
  // 43: Dublin, Ireland
  // 44: Paris, France
  // 45: Buenos Aires, Argentina
  // 46: Seattle, WA
  // 47: Las Vegas, NV
  // 48: Newark, NJ
  // 49: Auckland, New Zealand
  // 50: Bucharest, Romania
  // 51: Singapore
  // 52: rome, Italy
  // 53: Lisboa, Portugal
  // 54: Edmonton, Canada
  // 55: Taipei, Taiwan
  // 56: 
  // 57: Oslo, Norway
  // 58: Stockholm, Sweden
  // 59: Santiago, Chile
  // 60: Geneva, Switzerland
  // 61: São Paulo, Brazil
  // 62: Brussel, Belgium
  // 63: Houston, TX, US
  // 64: Atlanta, GA, US
  // 65: Baton Rouge, LA, US
  // 66: Osaka, Japan
  // 67: Bang-Kapi, Huaykwang, Bangkok
  // 68: Shanghai, China
  // 69: Warsaw, Poland
  // 70: Monterrey, NL; Mexico
  // 71: Kowloon, Hong Kong
  // 72: Memphis, TN, US
  // 73: Istanbul, Turkey
  // 74: Ottawa, ON, Canada
  // 75: Busan, South Korea
  // 76: Jakarta, Indonesia
  // 77: Belgrade, Serbia
  // 78: Budapest, Hungary
  // 79: Boston, MA, US
  // 80: Pittsburgh, PA, US
  // 81: Minneapolis, MN, US
  // 82: Denver, CO, US
  // 83: ?
  // 84: Cleveland, OH, US
  // 85: Indianapolis, IN, US
  // 86: Lima, Peru
  // 87: Turku, Finland
  // 88: Moscow, Russia
  // 89: ?
  // 90: Wichita, KS, US
  // 91: Vilnius, Lithuania
  // 92: Ciudad de Panama, Panama
  // 93: Rīga, Latvia
  // 94: Zadar, Croatia
  // 95: Sofia, Bulgaria
  // 96: South Sinai, Egypt
  // 97: Praha, Czech Republic
  // 98: Bratislava, Slovakia
  // 99: Copenhagen, Denmark
  // 100: Cape Town, South Africa
  // 101: Beiruit, Lebanon
  // 102: Flagstaff/Scottsdale, AZ, US
  // 103: Biloxi/Oxford, MS, US
  // 104: Oklahoma City/Tulsa, OK, US
  // 105: Columbia, SC, US
  // 106: Park City, UT, US
  // 107: Milwaukee, WI, US
  // 108: Birmingham, AL
  // 109: Anchorage, AK US
  // 110: Fayetteville, AR
  // 111: Hartford, CT
  // 112: Wilmington, DE
  // 113: Boise, ID
  // 114: Cedar Rapids, IA
  // 115: Louisville, KY
  // 116: Portland, ME
  // 117: Silver Spring, MD
  // 118: Kansas City, MO
  // 119: Bozeman, Montana
  // 120: Omaha, NE
  // 121: Manchester, NH
  // 122: Albuquerque, NM
  // 123: Charlotte, NC
  // 124: Fargo, ND
  // 125: Portland, OR
  // 126: ?
  // 127: Providence, RI
  // 128: Rapid City, SD
  // 129: Burlington, VT
  // 130: 
  // 131: 
  // 132: 
  // 133: 
  // 134: 
  // 135: 
  // 136: 
  // 137: 
  // 138: 
  // 139: 
  // 140: 
  // 141: 
  // 142: 
  // 143: 
  // 144: 
  // 145: 
  // 146: 
  // 147: 
  // 148: 
  // 149: 
  // 150: 
  // 151: 
  // 152: 
  // 153: 
  // 218: San Francisco/Oakland
const queryRAEventListings = `query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $filterOptions: FilterOptionsInputDtoInput, $page: Int, $pageSize: Int) 
{
  eventListings(filters: $filters, filterOptions: $filterOptions, pageSize: $pageSize, page: $page) 
  {
    data {
      id 
      listingDate 
      event {
        ...eventListingsFields artists {id name __typename} 
        __typename
      } 
      __typename
    } 
    filterOptions {
      genre {label value __typename}
      __typename
    } 
    totalResults 
    __typename
  }
}
fragment eventListingsFields on Event {
  id 
  date 
  startTime 
  endTime 
  title 
  contentUrl 
  flyerFront 
  isTicketed 
  attending 
  queueItEnabled 
  newEventForm 
  images {
    id 
    filename 
    alt 
    type 
    crop 
    __typename
  } 
  pick {
    id 
    blurb 
    __typename
  } 
  venue {
    id 
    name 
    address
    contentUrl 
    live 
    __typename
  } 
  __typename
}`;

const queryRAPopularEvents = `query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int)   
{ eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: {   
  attending: { priority: 1, order: DESCENDING } }) 
  {   
    data {     
      id     
      listingDate     
      event {       
        ...eventFields       
        __typename     
      }     
      __typename   
    }   
    __typename 
  }
}
fragment eventFields on Event 
{ 
  id 
  title 
  attending 
  date 
  contentUrl 
  flyerFront 
  queueItEnabled 
  newEventForm 
  images {   
    id   
    filename   
    alt   
    type   
    crop   
    __typename 
    } 
  venue {  
    id   
    name   
    contentUrl  
    live    
    __typename 
  }
  __typename 
}`

const enumQuery = `query IntrospectionQuery {
  __schema {
  queryType { name }
  mutationType { name }
  subscriptionType { name }
  types {
    ...FullType
  }
  directives {
    name
    description
    locations
    args {
    ...InputValue
    }
  }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
  name
  description
  args {
    ...InputValue
  }
  type {
    ...TypeRef
  }
  isDeprecated
  deprecationReason
  }
  inputFields {
  ...InputValue
  }
  interfaces {
  ...TypeRef
  }
  enumValues(includeDeprecated: true) {
  name
  description
  isDeprecated
  deprecationReason
  }
  possibleTypes {
  ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
  kind
  name
  ofType {
    kind
    name
    ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
        kind
        name
        }
      }
      }
    }
    }
  }
  }
}
`

// Does not work as is
const schemaQuery = `fragment FullType on __Type {
  kind
  name
  fields(includeDeprecated: true) {
    name
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}
fragment InputValue on __InputValue {
  name
  type {
    ...TypeRef
  }
  defaultValue
}
fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
query IntrospectionQuery {
  __schema {
    queryType {
      name
    }
    mutationType {
      name
    }
    types {
      ...FullType
    }
    directives {
      name
      locations
      args {
        ...InputValue
      }
    }
  }
}`

const search = `query {
  search(type:EventListing, query:"areas:218") {
    pageInfo {
      startCursor
      hasNextPage
      endCursor
    }
    userCount
    nodes {
        ... on User {
        bio
        company
        email
        id
        isBountyHunter
        isCampusExpert
        isDeveloperProgramMember
        isEmployee
        isHireable
        isSiteAdmin
        isViewer
        location
        login
        name
        url
        websiteUrl
      }
    }
  }
}`

const testQuery = `query GET_EVENTS($filters: FilterInputDtoInput, $pageSize: Int)   
    { eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: {   
      attending: { priority: 1, order: DESCENDING } }) 
      { 
        data {
          id
          listingDate
          event {
            ...eventFields  
            __typename 
          }     
          __typename   
        }   
        __typename 
      }
    }
    fragment eventFields on Event 
    { 
      id 
      title 
      attending 
      date 
      contentUrl 
      flyerFront 
      queueItEnabled 
      newEventForm 
      images {   
        id   
        filename   
        alt   
        type   
        crop   
        __typename 
        } 
      venue {  
        id   
        name   
        address
        contentUrl  
        live    
        __typename 
      }
      __typename 
    }`
