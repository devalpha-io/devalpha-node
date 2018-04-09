/// <reference types="highland" />
import { StreamAction, Feeds, FeedItem } from '../typings';
export declare function createMergedStream(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction>;
export declare function createSortedStream(feeds: Feeds<FeedItem>): Highland.Stream<StreamAction>;
