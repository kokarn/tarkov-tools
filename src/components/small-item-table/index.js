import {useMemo, useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Link,
} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react'
import { mdiClockAlertOutline } from '@mdi/js';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional
import Fuse from 'fuse.js'

import DataTable from '../data-table';
import formatPrice from '../../modules/format-price';
import { selectAllItems, fetchItems } from '../../features/items/itemsSlice';

import './index.css';

function fleaPriceCell({ value }) {
    if(value){
        return <div
            className = 'center-content'
        >
            {formatPrice(value)}
        </div>;
    }

    return <div
        className = 'center-content'
    >
        <Tippy
            placement = 'bottom'
            content={'No flea price seen in the past 24 hours'}
        >
            <Icon
                path={mdiClockAlertOutline}
                size={1}
                className = 'icon-with-text'
            />
        </Tippy>
    </div>
};

function instaProfitCell({ value }) {
    return <div
        className = 'center-content'
    >
        {value ? formatPrice(value) : '-'}
    </div>;
};

function traderPriceCell(datum) {
    if(datum.row.original.traderName === '?'){
        return null;
    }

    return <div
        className = 'trader-price-content'
    >
        <img
            alt = {datum.row.original.traderName}
            className = 'trader-icon'
            title = {datum.row.original.traderName}
            src={`${process.env.PUBLIC_URL}/images/${datum.row.original.traderName.toLowerCase()}-icon.jpg`}
        />
        {formatPrice(datum.row.values.traderPrice)}
    </div>;
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function SmallItemTable(props) {
    const {maxItems, nameFilter, defaultRandom} = props;
    const dispatch = useDispatch();
    const items = useSelector(selectAllItems);
    const itemStatus = useSelector((state) => {
        return state.items.status;
    });
    const {t} = useTranslation();

    useEffect(() => {
        if (itemStatus === 'idle') {
          dispatch(fetchItems());
        }
      }, [itemStatus, dispatch]);

    const data = useMemo(() => {
        let returnData = items.map((itemData) => {
            return {
                id: itemData.id,
                name: itemData.name,
                shortName: itemData.shortName,
                normalizedName: itemData.normalizedName,
                avg24hPrice: itemData.avg24hPrice,
                lastLowPrice: itemData.lastLowPrice,
                iconLink: `https://assets.tarkov-tools.com/${itemData.id}-icon.jpg`,
                itemLink: `/item/${itemData.normalizedName}`,
                instaProfit: itemData.lastLowPrice ? (itemData.traderPrice - itemData.lastLowPrice) : 0,
                traderName: itemData.traderName,
                traderPrice: itemData.traderPrice,
            }
        });
        // .filter(item => {
        //     if(!nameFilter){
        //         return true;
        //     }

        //     return item.name.toLowerCase().includes(nameFilter) || item.shortName.toLowerCase().includes(nameFilter);
        // });

        if(nameFilter){
            const options = {
                includeScore: true,
                // equivalent to `keys: [['author', 'tags', 'value']]`
                keys: ['name', 'shortname'],
              }

              const fuse = new Fuse(returnData, options);
              const result = fuse.search(nameFilter);

              returnData = result.sort((a, b) => b.score - a.score).map(resultObject => resultObject.item);
        }

        if(defaultRandom && !nameFilter){
            shuffleArray(returnData);
        }

        return returnData;
    },
        [nameFilter, defaultRandom, items]
    );

    const columns = useMemo(
        () => [
            {
                Header: t('Name'),
                accessor: 'name',
                Cell: (allData) => {
                    // allData.row.original.itemLink
                    return <div
                        className = 'small-item-table-name-wrapper'
                    >
                        <div
                            className = 'small-item-table-image-wrapper'
                        ><img
                            alt = ''
                            className = 'table-image'
                            loading = 'lazy'
                            src = { allData.row.original.iconLink }
                        /></div>
                        <div>
                            <Link
                                className = 'craft-reward-item-title'
                                to = {allData.row.original.itemLink}
                            >
                                {allData.row.original.name}
                            </Link>
                        </div>
                    </div>
                },
            },
            {
                Header: t('Trader'),
                accessor: d => Number(d.traderPrice),
                Cell: traderPriceCell,
                id: 'traderPrice',
            },
            {
                Header: t('Flea'),
                accessor: d => Number(d.lastLowPrice),
                Cell: fleaPriceCell,
                id: 'fleaPrice',
            },
            {
                Header: t('InstaProfit'),
                accessor: d => Number(d.instaProfit),
                Cell: instaProfitCell,
                id: 'instaProfit',
                sortDescFirst: true,
                sortType: (a, b) => {
                    if(a.values.instaProfit > b.values.instaProfit){
                        return 1;
                    }

                    if(a.values.instaProfit < b.values.instaProfit){
                        return -1;
                    }

                    return 0;
                },
            },
        ],
        [t]
    );

    if(data.length <= 0){
        return <div>
            {t('None')}
        </div>;
    }

    return <DataTable
        className = 'small-data-table'
        columns = {columns}
        key = 'small-item-table'
        data = {data}
        // sortBy = {'profit'}
        // sortByDesc = {true}
        autoResetSortBy = {false}
        maxItems = {maxItems}
    />
}

export default SmallItemTable;