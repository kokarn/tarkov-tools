/* eslint-disable no-restricted-globals */
import { useState, useMemo, useEffect } from 'react';
import {
    useParams,
    // useHistory,
} from "react-router-dom";

import {
    ScatterChart,
    Scatter,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList
} from 'recharts';

import useKeyPress from '../../hooks/useKeyPress';
import rawData from '../../data/ammo.json';

const shapes = [
    'circle',
    'cross',
    'diamond',
    'square',
    'star',
    'triangle',
    'wye',
];

const colors = [
    'tomato',
    'yellow',
    'green',
    'rgb(71, 121, 152)',
    'rgb(181, 59, 209)',
];

const MAX_DAMAGE = 170;
const MAX_PENETRATION = 70;

const formattedData = rawData.data.map((ammoData) => {
    const returnData = {
        ...ammoData,
        name: ammoData.shortName,
    };

    if(ammoData.damage > MAX_DAMAGE){
        returnData.name = `${ammoData.name} (${ammoData.damage})`;
        returnData.damage = MAX_DAMAGE;
    }

    if(ammoData.penetration > MAX_PENETRATION){
        returnData.name = `${ammoData.name} (${ammoData.penetration})`;
        returnData.penetration = MAX_PENETRATION;
    }

    return returnData;
})
.sort((a, b) => {
    return a.type.localeCompare(b.type);
});

let typeCache = [];
const legendData = formattedData
    .map((ammo, index) => {
        if (typeCache.includes(ammo.type)){
            return false;
        }

        typeCache.push(ammo.type);

        return {
            // ...ammo,
            name: ammo.type,
            symbol: shapes[index % shapes.length],
            fill: colors[index % colors.length],
        };
    })
    .filter(Boolean);

function Ammo() {
    const {currentAmmo} = useParams();
    let currentAmmoList = [];
    if(currentAmmo){
        currentAmmoList = currentAmmo.split(',');
    }
    // const history = useHistory();
    const [selectedLegendName, setSelectedLegendName] = useState(currentAmmoList);
    const shiftPress = useKeyPress('Shift');

    useEffect(() => {
        if(currentAmmo === []){
            setSelectedLegendName([]);

            return true;
        }

        if(currentAmmo){
            setSelectedLegendName(currentAmmo.split(','));
        } else {
            setSelectedLegendName([]);
        }
    }, [currentAmmo]);

    useEffect(() => {
        let viewableHeight = window.innerHeight - document.querySelector('.navigation')?.offsetHeight || 0;
        if(viewableHeight < 100){
            viewableHeight = window.innerHeight;
        }

        document.documentElement.style.setProperty('--display-height', `${viewableHeight}px`);

        return function cleanup() {
            document.documentElement.style.setProperty('--display-height', `auto`);
        };
    });

    const listState = useMemo(() => {
        const scatters = {};
        let parsedData = formattedData
            .filter(ammo => !selectedLegendName || selectedLegendName.length === 0 || selectedLegendName.includes(ammo.type))
            .map((ammo) => {
                if(!shiftPress){
                    return ammo;
                }

                return {
                    ...ammo,
                    name: `${ammo.name} (${ammo.fragChance})`,
                };
            });

        for(const ammoData of parsedData){
            if(!legendData.find(typeData => typeData.name === ammoData.type)){
                continue;
            }

            if(!scatters[ammoData.type]){
                let scatterData = legendData.find(typeData => typeData.name === ammoData.type);
                scatters[ammoData.type] = {
                    name: ammoData.type,
                    points: [],
                    symbol: scatterData.symbol,
                    fill: scatterData.fill,
                };
            }

           scatters[ammoData.type].points.push(ammoData);
        }

        return scatters;
    }, [selectedLegendName, shiftPress]);

    // const handleLegendClick = useCallback((event, { datum: { name } }) => {
    //     let newSelectedAmmo = [...selectedLegendName];
    //     const metaKey = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;

    //     if(newSelectedAmmo.includes(name) && metaKey){
    //         newSelectedAmmo.splice(newSelectedAmmo.indexOf(name), 1);
    //     } else if(newSelectedAmmo.includes(name)){
    //         newSelectedAmmo = [];
    //     } else if(metaKey){
    //         newSelectedAmmo.push(name);
    //     } else {
    //         newSelectedAmmo = [name];
    //     }

    //     setSelectedLegendName(newSelectedAmmo);
    //     history.push(`/ammo/${newSelectedAmmo.join(',')}`);

    // }, [selectedLegendName, setSelectedLegendName, history]);

    return <ResponsiveContainer>
        <ScatterChart
            width={730}
            height={250}
            margin={{
                top: 20,
                right: 20,
                bottom: 10,
                left: 10,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
                dataKey="damage"
                domain={[0, MAX_DAMAGE]}
                name="damage"
                type="number"
                interval={'preserveStartEnd'}
                tickCount = {19}
            />
            <YAxis
                dataKey="penetration"
                domain={[0, MAX_PENETRATION]}
                name="penetration"
                type="number"
                interval={'preserveStartEnd'}
                tickCount = {8}
            />
            <Legend
                align = 'right'
                layout = 'vertical'
                verticalAlign = 'top'
            />
            <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
            />
            {Object.values(listState).map((scatterData) => {
                return <Scatter
                    legendType={scatterData.symbol}
                    name={scatterData.name}
                    data={scatterData.points}
                    fill={scatterData.fill}
                    shape = {scatterData.symbol}
                    key = {scatterData.name}
                >
                    <LabelList
                        dataKey="name"
                        position = 'top'
                    />
                </Scatter>;
            })}
        </ScatterChart>
    </ResponsiveContainer>;
    // ];
}

export default Ammo;
