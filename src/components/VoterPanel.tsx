import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Radio,
  RadioGroup,
  useToast,
  Progress,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useWeb3 } from '../contexts/Web3Context';

interface Poll {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  options: string[];
  results?: number[];
  hasVoted?: boolean;
}

const VoterPanel: React.FC = () => {
  const { votingContract, account } = useWeb3();
  const toast = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    loadPolls();
    const interval = setInterval(loadPolls, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [votingContract]);

  const loadPolls = async () => {
    if (!votingContract || !account) return;

    try {
      const count = await votingContract.getPollsCount();
      const pollsData: Poll[] = [];

      for (let i = 0; i < count; i++) {
        const [info, results, hasVoted] = await Promise.all([
          votingContract.getPollInfo(i),
          votingContract.getPollResults(i),
          votingContract.hasVoted(i, account),
        ]);

        pollsData.push({
          id: i,
          title: info[0],
          description: info[1],
          startTime: Number(info[2]),
          endTime: Number(info[3]),
          isActive: info[4],
          options: info[5],
          results: results.map((r: bigint) => Number(r)),
          hasVoted,
        });
      }

      setPolls(pollsData);
    } catch (error) {
      console.error('Error loading polls:', error);
      toast({
        title: 'Error',
        description: 'Failed to load polls',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleVote = async (pollId: number) => {
    if (!votingContract || selectedOptions[pollId] === undefined) return;

    try {
      const tx = await votingContract.vote(pollId, selectedOptions[pollId]);
      await tx.wait();
      toast({
        title: 'Success',
        description: 'Vote cast successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadPolls();
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to cast vote',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTotalVotes = (results: number[] | undefined) => {
    if (!results) return 0;
    return results.reduce((a, b) => a + b, 0);
  };

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return (votes / total) * 100;
  };

  // Function to check if poll is truly active
  const isPollActive = (poll: Poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return poll.isActive && 
           currentTime >= poll.startTime && 
           currentTime <= poll.endTime;
  };

  // Function to check if poll is ended (either manually or by time)
  const isPollEnded = (poll: Poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return !poll.isActive || currentTime > poll.endTime;
  };

  // Function to get poll status text
  const getPollStatus = (poll: Poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (!poll.isActive) return "Ended";
    if (currentTime < poll.startTime) return "Not Started";
    if (currentTime > poll.endTime) return "Time Expired";
    return "Active";
  };

  const getWinner = (options: string[], results: number[] | undefined) => {
    if (!results || results.length === 0) return null;
    
    let maxVotes = 0;
    let winningIndices: number[] = [];
    
    // Find the maximum number of votes
    results.forEach((votes, index) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningIndices = [index];
      } else if (votes === maxVotes) {
        winningIndices.push(index);
      }
    });
    
    if (maxVotes === 0) return "No votes cast";
    
    // Handle tie
    if (winningIndices.length > 1) {
      const tiedOptions = winningIndices.map(index => options[index]).join(" and ");
      return `Tie between ${tiedOptions} with ${maxVotes} votes each`;
    }
    
    // Single winner
    return `${options[winningIndices[0]]} won with ${maxVotes} votes`;
  };

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Available Polls</Heading>
      {polls.map((poll) => (
        <Box
          key={poll.id}
          p={6}
          borderWidth={1}
          borderRadius="md"
          bg={isPollActive(poll) ? 'white' : 'gray.50'}
        >
          <Heading size="md">{poll.title}</Heading>
          <Text color="gray.600" mt={2}>{poll.description}</Text>
          <Text fontSize="sm" mt={2}>
            Status: {getPollStatus(poll)}
          </Text>
          <Text fontSize="sm">
            Time: {formatTime(poll.startTime)} - {formatTime(poll.endTime)}
          </Text>

          {isPollActive(poll) && !poll.hasVoted ? (
            <Box mt={4}>
              <RadioGroup
                onChange={(value) => setSelectedOptions({ ...selectedOptions, [poll.id]: Number(value) })}
                value={selectedOptions[poll.id]?.toString()}
              >
                <VStack align="stretch" spacing={2}>
                  {poll.options.map((option, index) => (
                    <Radio key={index} value={index.toString()}>
                      {option}
                    </Radio>
                  ))}
                </VStack>
              </RadioGroup>
              <Button
                colorScheme="blue"
                mt={4}
                onClick={() => handleVote(poll.id)}
                isDisabled={selectedOptions[poll.id] === undefined}
              >
                Cast Vote
              </Button>
            </Box>
          ) : (
            <Box mt={4}>
              {poll.hasVoted && !isPollEnded(poll) ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  You have voted in this poll. Results will be available after the poll ends.
                </Alert>
              ) : isPollEnded(poll) ? (
                // Only show results if poll has ended
                <>
                  <Text fontWeight="bold" mb={2}>Poll Results</Text>
                  <VStack align="stretch" spacing={2}>
                    {poll.options.map((option, index) => {
                      const votes = poll.results?.[index] || 0;
                      const total = getTotalVotes(poll.results);
                      const percentage = getVotePercentage(votes, total);

                      return (
                        <Box key={index}>
                          <Text fontSize="sm" mb={1}>
                            {option} - {votes} votes ({percentage.toFixed(1)}%)
                          </Text>
                          <Progress
                            value={percentage}
                            size="sm"
                            colorScheme="blue"
                            borderRadius="full"
                          />
                        </Box>
                      );
                    })}
                  </VStack>
                  <Text fontSize="sm" mt={2} color="gray.600">
                    Total votes: {getTotalVotes(poll.results)}
                  </Text>
                  <Box mt={4} p={3} bg="gray.100" borderRadius="md">
                    <Text fontWeight="bold" color="green.600">
                      Final Result: {getWinner(poll.options, poll.results)}
                    </Text>
                  </Box>
                </>
              ) : (
                // Poll is active but user can't vote
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  You cannot vote in this poll. Results will be available after the poll ends.
                </Alert>
              )}
            </Box>
          )}
        </Box>
      ))}
    </VStack>
  );
};

export default VoterPanel; 