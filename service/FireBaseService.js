import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import { LinkDB } from './dataIds/db';


export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl: LinkDB }),
    endpoints: (builder) => ({
        postProfileImg: builder.mutation({
            query: ({user_id, image}) => ({
                url: `profileImage/${user_id}.json`,
                method: 'PUT',
                body: {image},
            }),
        }),
        getImgProfile: builder.query({
            query: ({user_id}) => ({
                url: `profileImage/${user_id}.json`,
                method: 'GET',
            }),
        }),
        }),
    });

    export const { usePostProfileImgMutation, useGetImgProfileQuery } = api;
