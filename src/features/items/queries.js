import { useQuery } from 'react-query';
import doFetchItems, { doFetchItemByNormalizedName } from './do-fetch-items';

export const useItemsQuery = (queryOptions) => {
    const itemsQuery = useQuery('items', () => doFetchItems(), {
        refetchInterval: 600000,
        placeholderData: [],
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        ...queryOptions,
    });

    return itemsQuery;
};

export const useItemByIdQuery = (itemId, queryOptions) => {
    const itemQuery = useItemsQuery({
        select: (items) => items.find((item) => item.id === itemId),
        ...queryOptions,
    });

    return itemQuery;
};

export const useItemByNameQuery = (itemName, queryOptions) => {
    const itemQuery = useItemsQuery({
        select: (items) =>
            items.find((item) => item.normalizedName === itemName),
        ...queryOptions,
    });

    // Do a fast query to only fetch a basic version of the item we want
    const singleItemQuery = useQuery(
        ['items', itemName],
        () => doFetchItemByNormalizedName(itemName),
        {
            enabled: !Boolean(itemQuery.data),
        },
    );

    // But when we have all data, use that
    if (itemQuery.data) {
        return itemQuery;
    }

    return singleItemQuery;
};

export const useItemsWithTypeQuery = (type, queryOptions) => {
    const itemsQuery = useItemsQuery({
        select: (items) => items.filter((item) => item.types.includes(type)),
        ...queryOptions,
    });

    return itemsQuery;
};
