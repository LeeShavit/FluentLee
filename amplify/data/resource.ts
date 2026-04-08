import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Group: a.model({
    name: a.string().required(),
    cards: a.hasMany('Card', 'groupId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  Card: a.model({
    groupId: a.id().required(),
    group: a.belongsTo('Group', 'groupId'),
    word: a.string().required(),
    meaning: a.string().required(),
    example: a.string(),
    significance: a.integer().default(3),
    proficiency: a.enum(['NEW', 'RECOGNIZED', 'RECALLED', 'MASTERED']),
    cardTags: a.hasMany('CardTag', 'cardId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  Tag: a.model({
    name: a.string().required(),
    cardTags: a.hasMany('CardTag', 'tagId'),
  }).authorization((allow) => [allow.publicApiKey()]),

  CardTag: a.model({
    cardId: a.id().required(),
    tagId: a.id().required(),
    card: a.belongsTo('Card', 'cardId'),
    tag: a.belongsTo('Tag', 'tagId'),
  }).authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
